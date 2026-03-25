import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { OrganizationSalaryConfigService } from '../services/organizationSalaryConfig.service';
import {
  previewSalaryConfigSchema,
  saveSalaryConfigSchema,
} from '../validators/salaryConfiguration.validator';

const service = new OrganizationSalaryConfigService();

export class OrganizationSalaryConfigController {
  static async getActive(_req: Request, res: Response): Promise<void> {
    const result = await service.getActiveConfig();
    ApiResponse.success(res, 'Salary configuration retrieved', result);
  }

  static async listVersions(_req: Request, res: Response): Promise<void> {
    const result = await service.listVersions();
    ApiResponse.success(res, 'Salary configuration versions retrieved', result);
  }

  static async save(req: Request, res: Response): Promise<void> {
    const parsed = saveSalaryConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await service.saveNewVersion(parsed.data as any);
    ApiResponse.success(res, 'Salary configuration saved', result);
  }

  static async preview(req: Request, res: Response): Promise<void> {
    const parsed = previewSalaryConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await service.preview(parsed.data as any);
    ApiResponse.success(res, 'Salary preview generated', result);
  }
}
