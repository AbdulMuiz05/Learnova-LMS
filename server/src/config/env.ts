import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

const localEnv = path.resolve(__dirname, '../../.env');
const rootEnv = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

const boolFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z
    .string()
    .min(1)
    .default('mongodb://127.0.0.1:27017/learnova_lms'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  APP_NAME: z.string().default('Learnova'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me-now'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me-now'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('learnova-lms'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default('usd'),
  ALLOW_DEMO_PAYMENTS: boolFromString.default(true),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: boolFromString.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Learnova <no-reply@learnova.local>'),
  ADMIN_NAME: z.string().default('Platform Admin'),
  ADMIN_EMAIL: z.string().email().default('admin@learnova.local'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';

if (isProduction) {
  if (env.JWT_ACCESS_SECRET.includes('change-me') || env.JWT_REFRESH_SECRET.includes('change-me')) {
    throw new Error('JWT secrets must be changed in production. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.');
  }
  if (env.ALLOW_DEMO_PAYMENTS) {
    // Demo payments must never be enabled in production.
    env.ALLOW_DEMO_PAYMENTS = false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

export const accessCookieMaxAge = 15 * 60 * 1000;
export const refreshCookieMaxAge = 7 * 24 * 60 * 60 * 1000;
