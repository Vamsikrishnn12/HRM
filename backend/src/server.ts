import app from './app';
import { env } from './config/env';
import { AppDataSource } from './config/database';
import { seedAdmin } from './seed/seedAdmin';

const startServer = async (): Promise<void> => {
  try {
    // 1. Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    // 2. Run seed
    await seedAdmin();

    // 3. Start Express server
    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`Swagger docs available at http://localhost:${env.PORT}/api/docs`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception', error);
  process.exit(1);
});

startServer();
