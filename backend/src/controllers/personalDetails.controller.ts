import { Request, Response } from 'express';
import { PersonalDetailsService } from '../services/personalDetails.service';
import { savePersonalSchema } from '../validators/personalDetails.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const personalDetailsService = new PersonalDetailsService();

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
    ApiResponse.success(res, 'Personal details updated', result);
  }
}
