import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    // Validate input
    console.log("yess")
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }

    const result = await authService.login(parsed.data);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    ApiResponse.success(res, 'Login successful', {
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  /**
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token not found', 'AUTH_REFRESH_MISSING');
    }

    const result = await authService.refresh(refreshToken);

    // Set new refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    ApiResponse.success(res, 'Token refreshed successfully', {
      accessToken: result.accessToken,
    });
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    ApiResponse.success(res, 'Logged out successfully');
  }

  /**
   * GET /api/auth/me
   * Returns the current authenticated user's info.
   */
  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated', 'AUTH_REQUIRED');
    }

    ApiResponse.success(res, 'User info retrieved', {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    });
  }
}
