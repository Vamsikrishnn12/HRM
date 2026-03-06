import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import {
  applyLeaveSchema,
  adminActionSchema,
  adminOverrideSchema,
  updatePolicySchema,
} from '../validators/leave.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const leaveService = new LeaveService();

export class LeaveController {
  // ══════════════════════════════════════════════════════
  //  Employee Endpoints
  // ══════════════════════════════════════════════════════

  static async getMySummary(req: Request, res: Response): Promise<void> {
    const result = await leaveService.getEmployeeSummary(req.user!.userId);
    ApiResponse.success(res, 'Leave summary retrieved', result);
  }

  static async getMyPolicies(req: Request, res: Response): Promise<void> {
    const result = await leaveService.getEmployeePolicies(req.user!.userId);
    ApiResponse.success(res, 'Leave policies retrieved', result);
  }

  static async getMyHistory(req: Request, res: Response): Promise<void> {
    const result = await leaveService.getEmployeeHistory(req.user!.userId);
    ApiResponse.success(res, 'Leave history retrieved', result);
  }

  static async applyLeave(req: Request, res: Response): Promise<void> {
    const parsed = applyLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await leaveService.applyLeave(req.user!.userId, parsed.data);
    ApiResponse.created(res, 'Leave request submitted successfully', result);
  }

  static async cancelLeave(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await leaveService.cancelLeave(req.user!.userId, id);
    ApiResponse.success(res, 'Leave request cancelled', result);
  }

  // ══════════════════════════════════════════════════════
  //  Admin Endpoints
  // ══════════════════════════════════════════════════════

  static async getAdminRequests(req: Request, res: Response): Promise<void> {
    const filters = {
      status: req.query.status as string | undefined,
      leaveType: req.query.leaveType as string | undefined,
      employeeId: req.query.employeeId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    };
    const result = await leaveService.getAdminRequests(filters);
    ApiResponse.success(res, 'Leave requests retrieved', result);
  }

  static async getAdminRequestDetail(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await leaveService.getRequestDetail(id);
    ApiResponse.success(res, 'Leave request detail retrieved', result);
  }

  static async approveRequest(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const parsed = adminActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid input', 'VALIDATION_ERROR');
    }
    const result = await leaveService.approveRequest(id, req.user!.userId, parsed.data.remarks);
    ApiResponse.success(res, 'Leave request approved', result);
  }

  static async rejectRequest(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const parsed = adminActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid input', 'VALIDATION_ERROR');
    }
    const result = await leaveService.rejectRequest(id, req.user!.userId, parsed.data.remarks);
    ApiResponse.success(res, 'Leave request rejected', result);
  }

  static async overrideRequest(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const parsed = adminOverrideSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await leaveService.overrideRequest(id, req.user!.userId, parsed.data);
    ApiResponse.success(res, 'Leave request overridden', result);
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Policy Management
  // ══════════════════════════════════════════════════════

  static async getPolicy(_req: Request, res: Response): Promise<void> {
    const result = await leaveService.getLeavePolicy();
    ApiResponse.success(res, 'Leave policy retrieved', result);
  }

  static async updatePolicy(req: Request, res: Response): Promise<void> {
    const parsed = updatePolicySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await leaveService.updateLeavePolicy(parsed.data);
    ApiResponse.success(res, 'Leave policy updated', result);
  }
}
