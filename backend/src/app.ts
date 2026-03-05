import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';

const app = express();

// --------------- Global Middlewares ---------------

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request ID
app.use(requestIdMiddleware);

// --------------- Swagger Docs ---------------
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'HRMS API is running', timestamp: new Date().toISOString() });
});

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);


// --------------- 404 Handler ---------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errorCode: 'ROUTE_NOT_FOUND',
  });
});

// --------------- Error Handler ---------------
app.use(errorMiddleware);

export default app;
