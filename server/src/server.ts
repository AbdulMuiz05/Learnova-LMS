import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initializeSocket } from './sockets';

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} API listening on http://localhost:${env.PORT}`);
    logger.info(`Client origin: ${env.CLIENT_URL}`);
    logger.info(
      `Integrations: Cloudinary=${process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'off'}, Stripe=${
        env.STRIPE_SECRET_KEY ? 'configured' : 'off'
      }, Redis=${env.REDIS_URL ? 'configured' : 'in-memory fallback'}, SMTP=${
        env.SMTP_HOST ? 'configured' : 'off (codes logged)'
      }`
    );
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully…`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
