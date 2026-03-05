import app from './app';
import { env } from './config/env';
import { AppDataSource } from './config/database';
import { seedAdmin } from './seed/seedAdmin';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    // 1. Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // 2. Run seed
    await seedAdmin();

    // 3. Start Express server
    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

startServer();
