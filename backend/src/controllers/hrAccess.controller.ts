import { Request, Response } from 'express';
import { HrAccessService } from '../services/hrAccess.service';
import { grantHrAccessSchema } from '../validators/hrAccess.validator';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

const service = new HrAccessService();
export class HrAccessController {
  static async list(_req: Request, res: Response) {
    ApiResponse.success(res, 'HR portal access retrieved', await service.list());
  }
  static async grant(req: Request, res: Response) {
    const parsed = grantHrAccessSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues.map((i) => i.message).join('; '), 'VALIDATION_ERROR');
    ApiResponse.success(res, 'HR portal access granted', await service.grant(parsed.data, req.user!.userId));
  }
  static async revoke(req: Request, res: Response) {
    ApiResponse.success(res, 'HR portal access revoked', await service.revoke(req.params.id as string, req.user!.userId));
  }
}
