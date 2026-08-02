import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import { HrPortalAccess } from '../entities/HrPortalAccess.entity';

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      requestId?: string;
    }
  }
}

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is required', 'AUTH_TOKEN_MISSING');
  }

  const token = authHeader.split(' ')[1];

  let decoded: AccessTokenPayload;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token', 'AUTH_TOKEN_INVALID');
  }

  // Access tokens are stateless, so verify current account state as well. This
  // makes deactivation, offboarding, and deletion take effect immediately.
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: decoded.userId },
    select: ['id', 'isActive', 'deletedAt'],
  });
  if (!user || !user.isActive || user.deletedAt) {
    throw ApiError.unauthorized('This account is no longer active', 'AUTH_ACCOUNT_INACTIVE');
  }

  if (decoded.role === 'HR') {
    const grant = decoded.accessGrantId
      ? await AppDataSource.getRepository(HrPortalAccess).findOne({
          where: { id: decoded.accessGrantId, employeeId: decoded.userId, isActive: true },
          select: ['id'],
        })
      : null;
    if (!grant) {
      throw ApiError.unauthorized('HR portal access has been revoked', 'AUTH_HR_ACCESS_REVOKED');
    }
  }

  req.user = decoded;
  next();
};
