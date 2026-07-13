import { getEnv } from '@learnova/config';
import { closeDb } from '@learnova/database';
import { createApp } from './app.js';
import { logger } from './core/logger.js';

const app = createApp();

/**
 * Vercel runs Express as a serverless function and must receive the app via
 * `export default`. Locally (and on traditional hosts) we still call listen().
 */
const isServerless = Boolean(process.env.VERCEL);

if (!isServerless) {
  const env = getEnv();
  const port = Number(process.env.PORT) || env.API_PORT;

  const server = app.listen(port, () => {
    logger.info(`Learnova API listening on http://localhost:${port}/api/v1`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', reason));
}

export default app;
