import { LeaveRepository } from '../repositories/leave.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { EmailService } from './email.service';
import { ApiError } from '../utils/apiError';
import {
  LeaveType,
  RequestMode,
  HalfDaySession,
  LeaveStatus,
  LeaveRequest,
} from '../entities/LeaveRequest.entity';
import { LeavePolicy } from '../entities/LeavePolicy.entity';
import { LeavePolicySlab } from '../entities/LeavePolicySlab.entity';
import { UserRepository } from '../repositories/user.repository';

// ── Input types ──

interface ApplyLeaveInput {
  leaveType: string;
  requestMode: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  halfDaySession?: string;
  fromTime?: string;
  toTime?: string;
  reason: string;
}

export class LeaveService {
  private leaveRepo: LeaveRepository;
  private employeeRepo: EmployeeRepository;
  private settingsRepo: SettingsRepository;
  private userRepo: UserRepository;
  private emailService: EmailService;

  constructor() {
    this.leaveRepo = new LeaveRepository();
    this.employeeRepo = new EmployeeRepository();
    this.settingsRepo = new SettingsRepository();
    this.userRepo = new UserRepository();
    this.emailService = new EmailService();
  }

  // ══════════════════════════════════════════════════════
  //  Utility: Probation & Service Year Calculations
  // ══════════════════════════════════════════════════════

  private getYearsOfService(dateOfJoining: string): number {
    const doj = new Date(dateOfJoining);
    const now = new Date();
    let years = now.getFullYear() - doj.getFullYear();
    const monthDiff = now.getMonth() - doj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < doj.getDate())) {
      years--;
    }
    return Math.max(0, years);
  }

  private getMonthsOfService(dateOfJoining: string): number {
    const doj = new Date(dateOfJoining);
    const now = new Date();
    let months = (now.getFullYear() - doj.getFullYear()) * 12 + (now.getMonth() - doj.getMonth());
    if (now.getDate() < doj.getDate()) months--;
    return Math.max(0, months);
  }

  private isInProbation(dateOfJoining: string, probationMonths: number): boolean {
    return this.getMonthsOfService(dateOfJoining) < probationMonths;
  }

  private getApplicableSlab(slabs: LeavePolicySlab[], yearsOfService: number): LeavePolicySlab | null {
    // Sort by minYearsOfService ascending
    const sorted = [...slabs].sort((a, b) => a.minYearsOfService - b.minYearsOfService);
    for (const slab of sorted) {
      const max = slab.maxYearsOfService;
      if (yearsOfService >= slab.minYearsOfService && (max == null || yearsOfService < max)) {
        return slab;
      }
    }
    // Fallback: return the highest slab if years exceed all
    return sorted.length > 0 ? sorted[sorted.length - 1] : null;
  }

  private countBusinessDays(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    let count = 0;
    const current = new Date(s);
    while (current <= e) {
      count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  private calculatePermissionHours(fromTime: string, toTime: string): number {
    const [fh, fm] = fromTime.split(':').map(Number);
    const [th, tm] = toTime.split(':').map(Number);
    const fromMinutes = fh * 60 + fm;
    const toMinutes = th * 60 + tm;
    return Math.max(0, (toMinutes - fromMinutes) / 60);
  }

  // ══════════════════════════════════════════════════════
  //  Employee: Get Summary
  // ══════════════════════════════════════════════════════

  async getEmployeeSummary(userId: string) {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Employee profile not found', 'PROFILE_NOT_FOUND');

    const policy = await this.leaveRepo.getPolicyWithSlabs();
    if (!policy) {
      return this.buildEmptySummary(profile.dateOfJoining, profile.user);
    }

    const yearsOfService = this.getYearsOfService(profile.dateOfJoining);
    const monthsOfService = this.getMonthsOfService(profile.dateOfJoining);
    const inProbation = this.isInProbation(profile.dateOfJoining, policy.probationPeriodMonths);
    const slab = this.getApplicableSlab(policy.slabs ?? [], yearsOfService);

    const year = new Date().getFullYear();
    const approved = await this.leaveRepo.findApprovedByEmployeeAndYear(userId, year);

    // Count used leaves per type
    let usedCL = 0, usedSL = 0, usedEL = 0, usedLOP = 0;
    for (const req of approved) {
      const days = Number(req.totalDays ?? 0);
      switch (req.leaveType) {
        case LeaveType.CL: usedCL += days; break;
        case LeaveType.SL: usedSL += days; break;
        case LeaveType.EL: usedEL += days; break;
        case LeaveType.LOP: usedLOP += days; break;
      }
    }

    // Permission hours used this month
    const now = new Date();
    const permissions = await this.leaveRepo.findPermissionsByEmployeeAndMonth(
      userId, now.getFullYear(), now.getMonth() + 1,
    );
    const usedPermissionHours = permissions.reduce(
      (sum, p) => sum + Number(p.totalHours ?? 0), 0,
    );

    const entitlement = slab
      ? { cl: slab.casualLeavePerYear, sl: slab.sickLeavePerYear, el: slab.earnedLeavePerYear }
      : { cl: 0, sl: 0, el: 0 };

    return {
      employeeId: userId,
      employeeName: `${profile.user.firstName} ${profile.user.lastName}`,
      empId: profile.user.empId,
      dateOfJoining: profile.dateOfJoining,
      department: profile.department,
      designation: profile.designation,
      yearsOfService,
      monthsOfService,
      inProbation,
      probationEndsOn: inProbation
        ? this.addMonths(profile.dateOfJoining, policy.probationPeriodMonths)
        : null,
      probationLeaveAllowed: policy.probationLeaveAllowed,
      allowHalfDayLeave: policy.allowHalfDayLeave,
      allowPermissionHours: policy.allowPermissionHours,
      maxPermissionHoursPerMonth: Number(policy.maxPermissionHoursPerMonth),
      entitlement,
      used: { cl: usedCL, sl: usedSL, el: usedEL, lop: usedLOP },
      balance: {
        cl: Math.max(0, entitlement.cl - usedCL),
        sl: Math.max(0, entitlement.sl - usedSL),
        el: Math.max(0, entitlement.el - usedEL),
      },
      permissionHoursUsedThisMonth: usedPermissionHours,
      currentSlab: slab
        ? {
            minYears: slab.minYearsOfService,
            maxYears: slab.maxYearsOfService,
            cl: slab.casualLeavePerYear,
            sl: slab.sickLeavePerYear,
            el: slab.earnedLeavePerYear,
          }
        : null,
    };
  }

  private buildEmptySummary(dateOfJoining: string, user: any) {
    return {
      employeeId: user.id,
      employeeName: `${user.firstName} ${user.lastName}`,
      empId: user.empId,
      dateOfJoining,
      department: '',
      designation: '',
      yearsOfService: this.getYearsOfService(dateOfJoining),
      monthsOfService: this.getMonthsOfService(dateOfJoining),
      inProbation: true,
      probationEndsOn: null,
      probationLeaveAllowed: false,
      allowHalfDayLeave: false,
      allowPermissionHours: false,
      maxPermissionHoursPerMonth: 0,
      entitlement: { cl: 0, sl: 0, el: 0 },
      used: { cl: 0, sl: 0, el: 0, lop: 0 },
      balance: { cl: 0, sl: 0, el: 0 },
      permissionHoursUsedThisMonth: 0,
      currentSlab: null,
    };
  }

  private addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  // ══════════════════════════════════════════════════════
  //  Employee: Get Policies
  // ══════════════════════════════════════════════════════

  async getEmployeePolicies(userId: string) {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Employee profile not found', 'PROFILE_NOT_FOUND');

    const policy = await this.leaveRepo.getPolicyWithSlabs();
    if (!policy) {
      return { policy: null, slabs: [], applicableSlab: null };
    }

    const yearsOfService = this.getYearsOfService(profile.dateOfJoining);
    const slab = this.getApplicableSlab(policy.slabs ?? [], yearsOfService);

    return {
      policy: {
        probationPeriodMonths: policy.probationPeriodMonths,
        probationLeaveAllowed: policy.probationLeaveAllowed,
        allowHalfDayLeave: policy.allowHalfDayLeave,
        allowPermissionHours: policy.allowPermissionHours,
        maxPermissionHoursPerMonth: Number(policy.maxPermissionHoursPerMonth),
      },
      slabs: (policy.slabs ?? []).map((s) => ({
        minYears: s.minYearsOfService,
        maxYears: s.maxYearsOfService,
        cl: s.casualLeavePerYear,
        sl: s.sickLeavePerYear,
        el: s.earnedLeavePerYear,
      })),
      applicableSlab: slab
        ? {
            minYears: slab.minYearsOfService,
            maxYears: slab.maxYearsOfService,
            cl: slab.casualLeavePerYear,
            sl: slab.sickLeavePerYear,
            el: slab.earnedLeavePerYear,
          }
        : null,
    };
  }

  // ══════════════════════════════════════════════════════
  //  Employee: Apply Leave
  // ══════════════════════════════════════════════════════

  async applyLeave(userId: string, input: ApplyLeaveInput) {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) throw ApiError.notFound('Employee profile not found', 'PROFILE_NOT_FOUND');

    const policy = await this.leaveRepo.getPolicyWithSlabs();
    if (!policy) throw ApiError.badRequest('Leave policy not configured', 'LEAVE_POLICY_NOT_FOUND');

    const leaveType = input.leaveType as LeaveType;
    const requestMode = input.requestMode as RequestMode;
    const inProbation = this.isInProbation(profile.dateOfJoining, policy.probationPeriodMonths);

    // ── Probation check ──
    if (inProbation && !policy.probationLeaveAllowed && leaveType !== LeaveType.LOP) {
      throw ApiError.badRequest(
        'Paid leave is not available during probation. Your leave request will be treated as Loss of Pay. Please apply as LOP.',
        'LEAVE_PROBATION_NO_LEAVE',
      );
    }

    // ── Half-day check ──
    if (requestMode === RequestMode.HALF_DAY && !policy.allowHalfDayLeave) {
      throw ApiError.badRequest('Half-day leave is not allowed', 'LEAVE_HALF_DAY_NOT_ALLOWED');
    }

    // ── Permission check ──
    if (requestMode === RequestMode.PERMISSION) {
      if (!policy.allowPermissionHours) {
        throw ApiError.badRequest('Permission hours are not allowed', 'LEAVE_PERMISSION_NOT_ALLOWED');
      }
      if (!input.fromTime || !input.toTime || !input.date) {
        throw ApiError.badRequest('Permission requires date, fromTime and toTime', 'LEAVE_PERMISSION_MISSING_FIELDS');
      }
    }

    // ── Calculate totals ──
    let totalDays: number | null = null;
    let totalHours: number | null = null;
    let checkStartDate: string;
    let checkEndDate: string;

    if (requestMode === RequestMode.FULL_DAY) {
      if (!input.startDate || !input.endDate) {
        throw ApiError.badRequest('Full day leave requires startDate and endDate', 'LEAVE_DATES_REQUIRED');
      }
      if (input.startDate > input.endDate) {
        throw ApiError.badRequest('End date cannot be before start date', 'LEAVE_INVALID_DATE_RANGE');
      }
      totalDays = this.countBusinessDays(input.startDate, input.endDate);
      checkStartDate = input.startDate;
      checkEndDate = input.endDate;
    } else if (requestMode === RequestMode.HALF_DAY) {
      if (!input.date || !input.halfDaySession) {
        throw ApiError.badRequest('Half day leave requires date and session', 'LEAVE_HALF_DAY_MISSING');
      }
      totalDays = 0.5;
      checkStartDate = input.date;
      checkEndDate = input.date;
    } else {
      // PERMISSION
      totalHours = this.calculatePermissionHours(input.fromTime!, input.toTime!);
      if (totalHours <= 0) {
        throw ApiError.badRequest('Invalid permission time range', 'LEAVE_INVALID_PERMISSION_TIME');
      }

      // Check monthly limit
      const now = new Date();
      const permissions = await this.leaveRepo.findPermissionsByEmployeeAndMonth(
        userId, now.getFullYear(), now.getMonth() + 1,
      );
      const usedHours = permissions.reduce((s, p) => s + Number(p.totalHours ?? 0), 0);
      if (usedHours + totalHours > Number(policy.maxPermissionHoursPerMonth)) {
        throw ApiError.badRequest(
          `Monthly permission limit is ${policy.maxPermissionHoursPerMonth} hours. You have used ${usedHours.toFixed(1)} hours.`,
          'LEAVE_PERMISSION_LIMIT_EXCEEDED',
        );
      }
      checkStartDate = input.date!;
      checkEndDate = input.date!;
    }

    // ── Balance check (for paid leave types) ──
    if (leaveType !== LeaveType.LOP && leaveType !== LeaveType.PERMISSION && totalDays) {
      const summary = await this.getEmployeeSummary(userId);
      const balanceKey = leaveType.toLowerCase() as 'cl' | 'sl' | 'el';
      const available = summary.balance[balanceKey] ?? 0;
      if (totalDays > available) {
        throw ApiError.badRequest(
          `Insufficient ${leaveType} balance. Available: ${available}, Requested: ${totalDays}`,
          'LEAVE_INSUFFICIENT_BALANCE',
        );
      }
    }

    // ── Overlap check ──
    const overlapping = await this.leaveRepo.findOverlapping(userId, checkStartDate, checkEndDate);
    if (overlapping.length > 0) {
      throw ApiError.conflict(
        'Leave request overlaps with an existing request',
        'LEAVE_OVERLAP',
      );
    }

    // ── Build policy snapshot ──
    const yearsOfService = this.getYearsOfService(profile.dateOfJoining);
    const slab = this.getApplicableSlab(policy.slabs ?? [], yearsOfService);
    const policySnapshot = {
      probationPeriodMonths: policy.probationPeriodMonths,
      probationLeaveAllowed: policy.probationLeaveAllowed,
      inProbation,
      yearsOfService,
      slab: slab
        ? { cl: slab.casualLeavePerYear, sl: slab.sickLeavePerYear, el: slab.earnedLeavePerYear }
        : null,
    };

    // ── Create request ──
    const request = await this.leaveRepo.createRequest({
      employeeId: userId,
      leaveType,
      requestMode,
      startDate: requestMode === RequestMode.FULL_DAY ? input.startDate! : null,
      endDate: requestMode === RequestMode.FULL_DAY ? input.endDate! : null,
      date: requestMode !== RequestMode.FULL_DAY ? input.date! : null,
      halfDaySession: requestMode === RequestMode.HALF_DAY ? (input.halfDaySession as HalfDaySession) : null,
      fromTime: requestMode === RequestMode.PERMISSION ? input.fromTime! : null,
      toTime: requestMode === RequestMode.PERMISSION ? input.toTime! : null,
      totalDays,
      totalHours,
      reason: input.reason,
      status: LeaveStatus.PENDING,
      policySnapshot,
    });

    // ── Send emails ──
    this.sendLeaveAppliedEmails(profile.user, request).catch((err) =>
      console.error('Failed to send leave applied email', (err as Error).message),
    );

    return this.formatRequest(request, profile.user);
  }

  // ══════════════════════════════════════════════════════
  //  Employee: Cancel Leave
  // ══════════════════════════════════════════════════════

  async cancelLeave(userId: string, requestId: string) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');
    if (request.employeeId !== userId) throw ApiError.forbidden('Not your leave request', 'LEAVE_FORBIDDEN');
    if (request.status !== LeaveStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be cancelled', 'LEAVE_CANNOT_CANCEL');
    }

    request.status = LeaveStatus.CANCELLED;
    await this.leaveRepo.saveRequest(request);
    return this.formatRequest(request);
  }

  // ══════════════════════════════════════════════════════
  //  Employee: History
  // ══════════════════════════════════════════════════════

  async getEmployeeHistory(userId: string) {
    const requests = await this.leaveRepo.findRequestsByEmployee(userId);
    return requests.map((r) => this.formatRequest(r));
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Get Requests
  // ══════════════════════════════════════════════════════

  async getAdminRequests(filters: {
    status?: string;
    leaveType?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const requests = await this.leaveRepo.findAllRequests({
      status: filters.status,
      leaveType: filters.leaveType,
      employeeId: filters.employeeId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    // Enrich with employee details
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const profile = await this.employeeRepo.findByUserId(r.employeeId);
        const user = profile?.user;
        const inProbation = profile
          ? await this.checkEmployeeProbation(r.employeeId)
          : false;

        const formatted = {
          ...this.formatRequest(r, user),
          department: profile?.department ?? null,
          inProbation,
        };
        return formatted;
      }),
    );

    // Apply search filter client-side
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return enriched.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(search) ||
          r.employeeCode?.toLowerCase().includes(search),
      );
    }

    // Count summary
    const summary = {
      total: enriched.length,
      pending: enriched.filter((r) => r.status === LeaveStatus.PENDING).length,
      approved: enriched.filter((r) => r.status === LeaveStatus.APPROVED).length,
      rejected: enriched.filter((r) => r.status === LeaveStatus.REJECTED).length,
    };

    return { requests: enriched, summary };
  }

  private async checkEmployeeProbation(userId: string): Promise<boolean> {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) return false;
    const policy = await this.leaveRepo.getPolicy();
    if (!policy) return true;
    return this.isInProbation(profile.dateOfJoining, policy.probationPeriodMonths);
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Approve / Reject / Override
  // ══════════════════════════════════════════════════════

  async approveRequest(requestId: string, adminId: string, remarks?: string) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');
    if (request.status !== LeaveStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be approved', 'LEAVE_NOT_PENDING');
    }

    request.status = LeaveStatus.APPROVED;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    if (remarks) request.adminRemarks = remarks;
    await this.leaveRepo.saveRequest(request);

    // Send email
    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    if (profile?.user) {
      this.sendLeaveStatusEmail(profile.user, request, 'approved').catch((err) =>
        console.error('Failed to send approval email', (err as Error).message),
      );
    }

    return this.formatRequest(request, profile?.user);
  }

  async rejectRequest(requestId: string, adminId: string, remarks?: string) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');
    if (request.status !== LeaveStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be rejected', 'LEAVE_NOT_PENDING');
    }

    request.status = LeaveStatus.REJECTED;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    if (remarks) request.adminRemarks = remarks;
    await this.leaveRepo.saveRequest(request);

    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    if (profile?.user) {
      this.sendLeaveStatusEmail(profile.user, request, 'rejected').catch((err) =>
        console.error('Failed to send rejection email', (err as Error).message),
      );
    }

    return this.formatRequest(request, profile?.user);
  }

  async overrideRequest(
    requestId: string,
    adminId: string,
    data: { status: string; remarks?: string; leaveType?: string },
  ) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');

    request.status = data.status as LeaveStatus;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    if (data.remarks) request.adminRemarks = data.remarks;
    if (data.leaveType) request.leaveType = data.leaveType as LeaveType;
    await this.leaveRepo.saveRequest(request);

    return this.formatRequest(request);
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Policy Management
  // ══════════════════════════════════════════════════════

  async getLeavePolicy() {
    const policy = await this.leaveRepo.getPolicyWithSlabs();
    if (!policy) return { policy: null, slabs: [] };

    return {
      policy: {
        id: policy.id,
        probationPeriodMonths: policy.probationPeriodMonths,
        probationLeaveAllowed: policy.probationLeaveAllowed,
        allowHalfDayLeave: policy.allowHalfDayLeave,
        allowPermissionHours: policy.allowPermissionHours,
        maxPermissionHoursPerMonth: Number(policy.maxPermissionHoursPerMonth),
      },
      slabs: (policy.slabs ?? [])
        .sort((a, b) => a.minYearsOfService - b.minYearsOfService)
        .map((s) => ({
          id: s.id,
          minYearsOfService: s.minYearsOfService,
          maxYearsOfService: s.maxYearsOfService,
          casualLeavePerYear: s.casualLeavePerYear,
          sickLeavePerYear: s.sickLeavePerYear,
          earnedLeavePerYear: s.earnedLeavePerYear,
        })),
    };
  }

  async updateLeavePolicy(input: {
    probationPeriodMonths?: number;
    probationLeaveAllowed?: boolean;
    allowHalfDayLeave?: boolean;
    allowPermissionHours?: boolean;
    maxPermissionHoursPerMonth?: number;
    slabs?: Array<{
      minYearsOfService: number;
      maxYearsOfService: number | null;
      casualLeavePerYear: number;
      sickLeavePerYear: number;
      earnedLeavePerYear: number;
    }>;
  }) {
    const { slabs, ...policyFields } = input;

    const policy = await this.leaveRepo.upsertPolicy(policyFields as any);

    if (slabs) {
      await this.leaveRepo.replaceSlabs(policy.id, slabs as any);
    }

    return this.getLeavePolicy();
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Get Single Request Details
  // ══════════════════════════════════════════════════════

  async getRequestDetail(requestId: string) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');

    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    return this.formatRequest(request, profile?.user);
  }

  // ══════════════════════════════════════════════════════
  //  Email helpers
  // ══════════════════════════════════════════════════════

  private async sendLeaveAppliedEmails(user: any, request: LeaveRequest) {
    const dateRange = this.getDateRangeString(request);
    const daysOrHours = request.totalHours
      ? `${Number(request.totalHours).toFixed(1)} hours`
      : `${Number(request.totalDays)} day(s)`;

    // To employee
    await this.emailService.sendGenericEmail(
      user.email,
      'Leave Request Submitted',
      'leaveApplied',
      {
        firstName: user.firstName,
        leaveType: request.leaveType,
        requestMode: request.requestMode.replace('_', ' '),
        dateRange,
        daysOrHours,
        reason: request.reason,
        status: 'PENDING',
        year: new Date().getFullYear().toString(),
      },
    );
  }

  private async sendLeaveStatusEmail(user: any, request: LeaveRequest, action: 'approved' | 'rejected') {
    const dateRange = this.getDateRangeString(request);
    const daysOrHours = request.totalHours
      ? `${Number(request.totalHours).toFixed(1)} hours`
      : `${Number(request.totalDays)} day(s)`;

    await this.emailService.sendGenericEmail(
      user.email,
      `Leave Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      'leaveStatus',
      {
        firstName: user.firstName,
        leaveType: request.leaveType,
        requestMode: request.requestMode.replace('_', ' '),
        dateRange,
        daysOrHours,
        status: action.toUpperCase(),
        adminRemarks: request.adminRemarks || 'No remarks',
        year: new Date().getFullYear().toString(),
      },
    );
  }

  private getDateRangeString(request: LeaveRequest): string {
    if (request.requestMode === RequestMode.FULL_DAY) {
      return request.startDate === request.endDate
        ? request.startDate!
        : `${request.startDate} to ${request.endDate}`;
    }
    if (request.requestMode === RequestMode.HALF_DAY) {
      return `${request.date} (${request.halfDaySession})`;
    }
    return `${request.date} (${request.fromTime} - ${request.toTime})`;
  }

  // ══════════════════════════════════════════════════════
  //  Formatter
  // ══════════════════════════════════════════════════════

  private formatRequest(r: LeaveRequest, user?: any) {
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: user ? `${user.firstName} ${user.lastName}` : null,
      employeeCode: user?.empId ?? null,
      leaveType: r.leaveType,
      requestMode: r.requestMode,
      startDate: r.startDate,
      endDate: r.endDate,
      date: r.date,
      halfDaySession: r.halfDaySession,
      fromTime: r.fromTime,
      toTime: r.toTime,
      totalDays: r.totalDays ? Number(r.totalDays) : null,
      totalHours: r.totalHours ? Number(r.totalHours) : null,
      reason: r.reason,
      adminRemarks: r.adminRemarks,
      status: r.status,
      policySnapshot: r.policySnapshot,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
