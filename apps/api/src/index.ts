import { getEnv } from '@learnova/config';
import { closeDb } from '@learnova/database';
import { createApp } from './app.js';
import { logger } from './core/logger.js';

function bootstrap(): void {
  const env = getEnv();
  const app = createApp();

  const server = app.listen(env.API_PORT, () => {
    logger.info(`Learnova API listening on http://localhost:${env.API_PORT}${'/api/v1'}`);
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

bootstrap();
