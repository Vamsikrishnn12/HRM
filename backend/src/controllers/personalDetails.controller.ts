import { Request, Response } from 'express';
import { PersonalDetailsService } from '../services/personalDetails.service';
import { savePersonalSchema } from '../validators/personalDetails.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { NotificationService } from '../services/notification.service';

const personalDetailsService = new PersonalDetailsService();
const notificationService = new NotificationService();

export class PersonalDetailsController {
  static async getMe(req: Request, res: Response): Promise<void> {
    const result = await personalDetailsService.getByUserId(req.user!.userId);
    ApiResponse.success(res, 'Personal details retrieved', result);
  }

  static async saveMe(req: Request, res: Response): Promise<void> {
    const parsed = savePersonalSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await personalDetailsService.savePersonal(req.user!.userId, parsed.data);
    ApiResponse.success(res, 'Personal details saved', result);
  }

  static async list(_req: Request, res: Response): Promise<void> {
    const result = await personalDetailsService.listAll();
    ApiResponse.success(res, 'Personal details retrieved', result);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await personalDetailsService.getById(id);
    ApiResponse.success(res, 'Personal details retrieved', result);
  }

  static async getByUserId(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const result = await personalDetailsService.getByUserId(userId);
    ApiResponse.success(res, 'Personal details retrieved', result);
  }

  static async save(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const parsed = savePersonalSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await personalDetailsService.savePersonal(userId, parsed.data);
    notificationService.notifyUser(userId, 'PERSONAL_DETAILS_UPDATED', 'Personal details updated', 'HR updated your personal information.', '/employee/personal-details')
      .catch((err) => console.error('Failed to create personal details notification', err.message));
    ApiResponse.success(res, 'Personal details saved', result);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const parsed = savePersonalSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await personalDetailsService.updateById(id, parsed.data);
    if ((result as any)?.userId) {
      notificationService.notifyUser((result as any).userId, 'PERSONAL_DETAILS_UPDATED', 'Personal details updated', 'HR updated your personal information.', '/employee/personal-details')
        .catch((err) => console.error('Failed to create personal details notification', err.message));
    }
    ApiResponse.success(res, 'Personal details updated', result);
  }
}
