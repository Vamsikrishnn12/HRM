import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

/**
 * Role-based authorization middleware.
 * Must be used AFTER authMiddleware so req.user is populated.
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required', 'AUTH_REQUIRED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        'You do not have permission to access this resource',
        'AUTH_INSUFFICIENT_ROLE',
      );
    }

    next();
  };
};
