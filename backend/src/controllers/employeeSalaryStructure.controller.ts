import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { EmployeeSalaryStructureService } from '../services/employeeSalaryStructure.service';
import {
  previewEmployeeSalaryStructureSchema,
  saveEmployeeSalaryStructureSchema,
} from '../validators/employeeSalaryStructure.validator';

const service = new EmployeeSalaryStructureService();

export class EmployeeSalaryStructureController {
  static async list(_req: Request, res: Response): Promise<void> {
    const result = await service.listLatestStructures();
    ApiResponse.success(res, 'Employee salary structures retrieved', result);
  }

  static async getLatestByEmployee(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const result = await service.getLatestByEmployee(userId);
    ApiResponse.success(res, 'Employee salary structure retrieved', result);
  }

  static async preview(req: Request, res: Response): Promise<void> {
    const parsed = previewEmployeeSalaryStructureSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await service.preview(parsed.data as any);
    ApiResponse.success(res, 'Employee salary preview generated', result);
  }

  static async save(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const parsed = saveEmployeeSalaryStructureSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await service.saveForEmployee(userId, parsed.data as any);
    ApiResponse.success(res, 'Employee salary structure saved', result);
  }
}
