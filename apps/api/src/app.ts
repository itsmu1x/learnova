import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import { APP, getEnv, isProduction } from '@learnova/config';
import { errorHandler, notFoundHandler } from './core/middleware/error-handler.js';
import { globalRateLimiter } from './core/middleware/rate-limit.js';
import { buildApiRouter } from './router.js';
import { stripeWebhookHandler } from './modules/payments/webhook.js';
import { asyncHandler } from './core/http/async-handler.js';

export function createApp(): Application {
  const app = express();
  const env = getEnv();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: [env.WEB_URL],
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.requestId = randomUUID();
    next();
  });
  if (!isProduction()) app.use(morgan('dev'));

  // Stripe webhook needs the raw body and must precede the JSON parser.
  app.post(
    `${APP.API_PREFIX}/payments/webhook`,
    express.raw({ type: 'application/json' }),
    asyncHandler(stripeWebhookHandler),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'healthy', uptime: process.uptime() } });
  });

  app.use(APP.API_PREFIX, buildApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
