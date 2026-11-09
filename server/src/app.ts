import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env, isProduction } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/error';
import { sanitizeRequest } from './middleware/sanitize';
import { generalLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import curriculumRoutes from './routes/curriculum.routes';
import categoryRoutes from './routes/category.routes';
import siteRoutes from './routes/site.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import { stripeWebhook } from './controllers/payment.controller';
import reviewRoutes from './routes/review.routes';
import questionRoutes from './routes/question.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import { sendSuccess } from './utils/response';

interface CreateAppOptions {
  /**
   * Serverless runtimes must await a MongoDB connection before handling a
   * request. Long-running local servers call connectDB() during bootstrap.
   */
  awaitDatabase?: boolean;
}

export function createApp(options: CreateAppOptions = {}): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  if (options.awaitDatabase) {
    app.use(async (req, _res, next) => {
      if (req.method === 'OPTIONS' || req.path === '/api/health') {
        next();
        return;
      }
      try {
        await connectDB();
        next();
      } catch (error) {
        next(error);
      }
    });
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed =
          origin === env.CLIENT_URL ||
          (!isProduction && /^https?:\/\/localhost:\d+$/.test(origin)) ||
          (!isProduction && /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin));
        callback(null, allowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(compression());

  // Stripe requires the raw body for signature verification — register before JSON parsing.
  app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeRequest);

  if (!isProduction) {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        logger.debug(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - startedAt}ms)`);
      });
      next();
    });
  }

  app.get('/api/health', (_req, res) => {
    sendSuccess(res, {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      environment: env.NODE_ENV,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', generalLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api', siteRoutes);
  app.use('/api', curriculumRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
