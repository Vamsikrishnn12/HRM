import app from './app';
import { env } from './config/env';
import { ensureBackendReady } from './config/bootstrap';

const startServer = async (): Promise<void> => {
  try {
    // Initialize the same database bootstrap used by Vercel functions.
    await ensureBackendReady();
    console.log('Database connection established');

    // Start the long-running local server.
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
