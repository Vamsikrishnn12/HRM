import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceStatus } from '../entities/Attendance.entity';
import {
  startWorkSchema,
  endWorkSchema,
  overrideStatusSchema,
  manualEntrySchema,
  reEnableStartWorkSchema,
  adminOverrideByEmployeeSchema,
  adminManualEntryByEmployeeSchema,
} from '../validators/attendance.validator';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const attendanceService = new AttendanceService();

export class AttendanceController {
  // ── Employee endpoints ──

  static async getMyToday(req: Request, res: Response): Promise<void> {
    const result = await attendanceService.getTodayAttendance(req.user!.userId);
    ApiResponse.success(res, 'Today attendance retrieved', result);
  }

  static async startWork(req: Request, res: Response): Promise<void> {
    const parsed = startWorkSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await attendanceService.startWork(req.user!.userId, parsed.data);
    ApiResponse.success(res, 'Attendance started successfully', result);
  }

  static async endWork(req: Request, res: Response): Promise<void> {
    const parsed = endWorkSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await attendanceService.endWork(req.user!.userId, parsed.data);
    ApiResponse.success(res, 'Work ended successfully', result);
  }

  static async getMyHistory(req: Request, res: Response): Promise<void> {
    const daysParam = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
    const days = daysParam ? parseInt(String(daysParam), 10) : 30;
    const result = await attendanceService.getHistory(req.user!.userId, days);
    ApiResponse.success(res, 'Attendance history retrieved', result);
  }

  // ── Admin endpoints ──

  static async getAdminAttendance(req: Request, res: Response): Promise<void> {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await attendanceService.getAdminAttendance(date, status, search);
    ApiResponse.success(res, 'Attendance records retrieved', result);
  }

  static async getAdminEmployeeAttendance(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId as string;
    const daysParam = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
    const days = daysParam ? parseInt(String(daysParam), 10) : 30;
    const result = await attendanceService.getAdminEmployeeAttendance(employeeId, days);
    ApiResponse.success(res, 'Employee attendance retrieved', result);
  }

  static async overrideStatus(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId as string;
    const parsed = adminOverrideByEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await attendanceService.overrideStatus(
      employeeId,
      parsed.data.date,
      parsed.data.status as AttendanceStatus,
      parsed.data.reason,
    );
    ApiResponse.success(res, 'Attendance status overridden successfully', result);
  }

  static async manualEntry(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId as string;
    const parsed = adminManualEntryByEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await attendanceService.manualEntry(employeeId, parsed.data.date, {
      ...parsed.data,
      status: parsed.data.status as AttendanceStatus | undefined,
    });
    ApiResponse.success(res, 'Attendance updated manually', result);
  }

  static async reEnableStartWork(req: Request, res: Response): Promise<void> {
    const employeeId = req.params.employeeId as string;
    const parsed = reEnableStartWorkSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw ApiError.badRequest(messages.join('; '), 'VALIDATION_ERROR');
    }
    const result = await attendanceService.reEnableStartWork(
      employeeId,
      req.user!.userId,
      parsed.data,
    );
    ApiResponse.success(res, 'Start work override enabled successfully', result);
  }
}
