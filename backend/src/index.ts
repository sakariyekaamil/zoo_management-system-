import app from './app';
import { config } from './config';
import { ensureDatabaseConnection } from './config/prisma';
import logger from './utils/logger';

const start = async () => {
  try {
    await ensureDatabaseConnection();
    logger.info('Database connection ready');
  } catch (error) {
    logger.error('Database is unreachable. Check Neon status and DATABASE_URL.', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

start();
