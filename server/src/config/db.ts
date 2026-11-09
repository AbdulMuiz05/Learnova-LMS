import mongoose from 'mongoose';
import { env, isProduction } from './env';
import { logger } from '../utils/logger';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

// Vercel reuses a warm function instance, but module state is discarded between
// cold starts. Caching on globalThis keeps one pooled connection per instance
// and avoids opening a new connection for every invocation.
const globalForMongoose = globalThis as typeof globalThis & {
  __learnovaMongoose?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.__learnovaMongoose ?? {
  conn: null,
  promise: null,
  uri: null,
};

globalForMongoose.__learnovaMongoose = cached;

const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  autoIndex: true,
};

export async function connectDB(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  if (!isProduction) {
    mongoose.set('debug', false);
  }

  if (cached.uri !== uri && cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.promise && cached.uri === uri) {
    cached.conn = await cached.promise;
    if (mongoose.connection.readyState === 1) return cached.conn;

    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn && cached.uri === uri && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || cached.uri !== uri) {
    cached.uri = uri;
    cached.promise = mongoose
      .connect(uri, connectionOptions)
      .then((connection) => {
        cached.conn = connection;
        logger.info(
          `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
        );
        return connection;
      })
      .catch((error) => {
        cached.conn = null;
        cached.promise = null;
        cached.uri = null;
        logger.error('MongoDB connection failed', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
  cached.uri = null;
}
