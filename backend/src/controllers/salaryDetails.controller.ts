import { Request, Response } from 'express';
import { SalaryDetailsService } from '../services/salaryDetails.service';
import { saveSalarySchema } from '../validators/salaryDetails.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { NotificationService } from '../services/notification.service';

const salaryDetailsService = new SalaryDetailsService();
const notificationService = new NotificationService();

export class SalaryDetailsController {
  static async list(_req: Request, res: Response): Promise<void> {
    const result = await salaryDetailsService.listAll();
    ApiResponse.success(res, 'Salary details retrieved', result);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await salaryDetailsService.getById(id);
    ApiResponse.success(res, 'Salary details retrieved', result);
  }

  static async getByUserId(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const result = await salaryDetailsService.getByUserId(userId);
    ApiResponse.success(res, 'Salary details retrieved', result);
  }

  static async save(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const parsed = saveSalarySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await salaryDetailsService.saveSalary(userId, parsed.data);
    notificationService.notifyUser(userId, 'SALARY_UPDATED', 'Salary and banking details updated', 'HR updated your salary structure or banking information.', '/employee/payroll')
      .catch((err) => console.error('Failed to create salary notification', err.message));
    ApiResponse.success(res, 'Salary details saved', result);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const parsed = saveSalarySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await salaryDetailsService.updateById(id, parsed.data);
    if ((result as any)?.userId) {
      notificationService.notifyUser((result as any).userId, 'SALARY_UPDATED', 'Salary and banking details updated', 'HR updated your salary structure or banking information.', '/employee/payroll')
        .catch((err) => console.error('Failed to create salary notification', err.message));
    }
    ApiResponse.success(res, 'Salary details updated', result);
  }
}
