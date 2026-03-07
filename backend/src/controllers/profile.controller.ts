import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { changePasswordSchema, updateProfileSchema } from '../validators/profile.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const profileService = new ProfileService();

export class ProfileController {
  static async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const result = await profileService.getMyProfile(userId);
    ApiResponse.success(res, 'Profile fetched successfully', result);
  }

  static async updateMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await profileService.updateMyProfile(userId, parsed.data);
    ApiResponse.success(res, 'Profile updated successfully', result);
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    await profileService.changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
    ApiResponse.success(res, 'Password changed successfully');
  }
}
