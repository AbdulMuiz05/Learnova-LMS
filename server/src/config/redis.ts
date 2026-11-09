import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

type MemoryEntry = { value: string; expiresAt: number };

/**
 * Cache layer with Upstash/Redis support and an automatic in-memory fallback.
 * The fallback keeps the app fully functional for local demos without Redis.
 */
class CacheService {
  private client: Redis | null = null;
  private memory = new Map<string, MemoryEntry>();
  private connected = false;
  private attemptedConnection = false;

  private async ensureClient(): Promise<Redis | null> {
    if (!env.REDIS_URL) return null;
    if (this.attemptedConnection) return this.connected ? this.client : null;
    this.attemptedConnection = true;
    try {
      this.client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
      });
      this.client.on('error', (error) => {
        logger.warn(`Redis error: ${error.message}. Falling back to in-memory cache.`);
      });
      await this.client.connect();
      this.connected = true;
      logger.info('Redis cache connected');
    } catch (error) {
      logger.warn('Redis unavailable. Using in-memory cache fallback.');
      this.connected = false;
      this.client = null;
    }
    return this.connected ? this.client : null;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.ensureClient();
      if (client) {
        const raw = await client.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      }
      const entry = this.memory.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        this.memory.delete(key);
        return null;
      }
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 120): Promise<void> {
    try {
      const client = await this.ensureClient();
      const raw = JSON.stringify(value);
      if (client) {
        await client.set(key, raw, 'EX', ttlSeconds);
        return;
      }
      this.memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
    } catch {
      // Cache failures must never break requests.
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      if (client) {
        await client.del(key);
        return;
      }
      this.memory.delete(key);
    } catch {
      // ignore
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      const client = await this.ensureClient();
      if (client) {
        let cursor = '0';
        do {
          const [next, keys] = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
          cursor = next;
          if (keys.length) await client.del(...keys);
        } while (cursor !== '0');
        return;
      }
      for (const key of Array.from(this.memory.keys())) {
        if (key.startsWith(prefix)) this.memory.delete(key);
      }
    } catch {
      // ignore
    }
  }

  async flush(): Promise<void> {
    try {
      const client = await this.ensureClient();
      if (client) {
        await client.flushdb();
        return;
      }
      this.memory.clear();
    } catch {
      // ignore
    }
  }
}

export const cache = new CacheService();

export const cacheKeys = {
  homepage: 'lms:homepage',
  categories: 'lms:categories',
  courses: 'lms:courses:',
  course: (slugOrId: string) => `lms:course:${slugOrId}`,
  settings: 'lms:settings',
  adminAnalytics: 'lms:admin:analytics',
};

export async function invalidateCourseCaches(slug?: string): Promise<void> {
  await cache.delByPrefix(cacheKeys.courses);
  if (slug) await cache.del(cacheKeys.course(slug));
  await cache.del(cacheKeys.homepage);
  await cache.del(cacheKeys.adminAnalytics);
}
