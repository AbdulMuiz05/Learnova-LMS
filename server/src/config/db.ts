import mongoose from 'mongoose';
import { env, isProduction } from './env';
import { logger } from '../utils/logger';

export async function connectDB(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  if (!isProduction) {
    mongoose.set('debug', false);
  }
  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });
    logger.info(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
