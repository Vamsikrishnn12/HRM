import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

/**
 * Centralized error handling middleware.
 * Must be registered last in the Express middleware chain.
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const zodErr = err as any;
    const messages = zodErr.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) ?? [];
    res.status(400).json({
      success: false,
      message: messages.join('; ') || 'Validation error',
      errorCode: 'VALIDATION_ERROR',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      errorCode: 'AUTH_TOKEN_INVALID',
    });
    return;
  }

  // Unknown errors
  console.error(`Unhandled error: ${err.message}`, err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
  });
};
