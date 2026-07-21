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
import { LeavePolicySlab } from '../entities/LeavePolicySlab.entity';
import { AttendanceService } from './attendance.service';
import { AlternateSaturdayRule } from '../entities/OrgSettings.entity';
import { NotificationService } from './notification.service';

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
  private emailService: EmailService;
  private attendanceService: AttendanceService;
  private notificationService: NotificationService;

  constructor() {
    this.leaveRepo = new LeaveRepository();
    this.employeeRepo = new EmployeeRepository();
    this.settingsRepo = new SettingsRepository();
    this.emailService = new EmailService();
    this.attendanceService = new AttendanceService();
    this.notificationService = new NotificationService();
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

  private listDatesInRange(startDate: string, endDate: string): string[] {
    const result: string[] = [];
    const cursor = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    while (cursor.getTime() <= end.getTime()) {
      result.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  private isWeeklyOffDate(
    dateStr: string,
    weekOffDaysRaw: string,
    alternateSaturdayOffRule: AlternateSaturdayRule,
  ): boolean {
    const date = new Date(`${dateStr}T00:00:00`);
    const configuredDays = (weekOffDaysRaw || '')
      .split(',')
      .map((day) => day.trim().toUpperCase())
      .filter(Boolean);

    const dayName = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getDay()];

    if (dayName === 'SATURDAY' && alternateSaturdayOffRule !== AlternateSaturdayRule.NONE) {
      const saturdayOrder = Math.floor((date.getDate() - 1) / 7) + 1;
      if (alternateSaturdayOffRule === AlternateSaturdayRule.SECOND_FOURTH) {
        return saturdayOrder === 2 || saturdayOrder === 4;
      }
      if (alternateSaturdayOffRule === AlternateSaturdayRule.FIRST_THIRD) {
        return saturdayOrder === 1 || saturdayOrder === 3;
      }
    }

    return configuredDays.includes(dayName);
  }

  private getRequestRange(request: LeaveRequest): { startDate: string; endDate: string } {
    if (request.requestMode === RequestMode.FULL_DAY) {
      return { startDate: request.startDate!, endDate: request.endDate! };
    }
    return { startDate: request.date!, endDate: request.date! };
  }

  private getEffectiveLeaveType(request: LeaveRequest): LeaveType {
    return request.approvedLeaveType ?? request.leaveType;
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
      switch (this.getEffectiveLeaveType(req)) {
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
      maxPermissionRequestsPerMonth: Number(policy.maxPermissionRequestsPerMonth),
      maxRegularizationsPerMonth: Number(policy.maxRegularizationsPerMonth),
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
      maxPermissionRequestsPerMonth: 0,
      maxRegularizationsPerMonth: 0,
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
        maxPermissionRequestsPerMonth: Number(policy.maxPermissionRequestsPerMonth),
        maxRegularizationsPerMonth: Number(policy.maxRegularizationsPerMonth),
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

    const requestMode = input.requestMode as RequestMode;
    const leaveType =
      requestMode === RequestMode.PERMISSION
        ? LeaveType.PERMISSION
        : (input.leaveType as LeaveType);
    const inProbation = this.isInProbation(profile.dateOfJoining, policy.probationPeriodMonths);

    if (requestMode === RequestMode.HALF_DAY && !policy.allowHalfDayLeave) {
      throw ApiError.badRequest('Half-day leave is not allowed', 'LEAVE_HALF_DAY_NOT_ALLOWED');
    }
    if (requestMode === RequestMode.PERMISSION) {
      if (!policy.allowPermissionHours) {
        throw ApiError.badRequest('Permission hours are not allowed', 'LEAVE_PERMISSION_NOT_ALLOWED');
      }
      if (!input.fromTime || !input.toTime || !input.date) {
        throw ApiError.badRequest(
          'Permission requires date, fromTime and toTime',
          'LEAVE_PERMISSION_MISSING_FIELDS',
        );
      }
    }

    let totalDays: number | null = null;
    let totalHours: number | null = null;
    let checkStartDate: string;
    let checkEndDate: string;

    if (requestMode === RequestMode.FULL_DAY) {
      if (!input.startDate || !input.endDate) {
        throw ApiError.badRequest(
          'Full day leave requires startDate and endDate',
          'LEAVE_DATES_REQUIRED',
        );
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
      totalHours = this.calculatePermissionHours(input.fromTime!, input.toTime!);
      if (totalHours <= 0) {
        throw ApiError.badRequest('Invalid permission time range', 'LEAVE_INVALID_PERMISSION_TIME');
      }
      const permissionDate = new Date(`${input.date!}T00:00:00`);
      const permissions = await this.leaveRepo.findPermissionsByEmployeeAndMonth(
        userId,
        permissionDate.getFullYear(),
        permissionDate.getMonth() + 1,
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

    if (checkStartDate < profile.dateOfJoining) {
      throw ApiError.badRequest(
        'Leave cannot be applied for dates before joining date',
        'LEAVE_BEFORE_JOINING_DATE',
      );
    }

    const settings = await this.settingsRepo.getSettings();
    const datesToValidate = this.listDatesInRange(checkStartDate, checkEndDate);
    const holidayRows = await Promise.all(
      datesToValidate.map((date) => this.settingsRepo.findHolidayByDate(date)),
    );
    const holidayHit = holidayRows.find((row) => Boolean(row));
    if (holidayHit) {
      throw ApiError.badRequest(
        `Leave cannot be applied on holiday (${holidayHit.name} - ${holidayHit.date})`,
        'LEAVE_HOLIDAY_NOT_ALLOWED',
      );
    }
    if (
      settings &&
      datesToValidate.some((date) =>
        this.isWeeklyOffDate(date, settings.weekOffDays, settings.alternateSaturdayOffRule),
      )
    ) {
      throw ApiError.badRequest(
        'Leave cannot be applied on configured weekly-off days',
        'LEAVE_WEEKLY_OFF_NOT_ALLOWED',
      );
    }

    const probationForcesLop =
      inProbation &&
      !policy.probationLeaveAllowed &&
      leaveType !== LeaveType.LOP &&
      leaveType !== LeaveType.PERMISSION;

    if (
      !probationForcesLop &&
      leaveType !== LeaveType.LOP &&
      leaveType !== LeaveType.PERMISSION &&
      totalDays
    ) {
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

    const overlapping = await this.leaveRepo.findOverlapping(userId, checkStartDate, checkEndDate);
    if (overlapping.length > 0) {
      throw ApiError.conflict(
        'Leave request overlaps with an existing request',
        'LEAVE_OVERLAP',
      );
    }

    const suggestedLeaveType = probationForcesLop ? LeaveType.LOP : leaveType;
    const treatmentNote = probationForcesLop
      ? 'Employee is in probation and paid leave is disabled by policy. Suggested treatment is LOP unless admin overrides.'
      : null;

    const yearsOfService = this.getYearsOfService(profile.dateOfJoining);
    const slab = this.getApplicableSlab(policy.slabs ?? [], yearsOfService);
    const policySnapshot = {
      probationPeriodMonths: policy.probationPeriodMonths,
      probationLeaveAllowed: policy.probationLeaveAllowed,
      inProbation,
      yearsOfService,
      suggestedLeaveType,
      treatmentNote,
      slab: slab
        ? { cl: slab.casualLeavePerYear, sl: slab.sickLeavePerYear, el: slab.earnedLeavePerYear }
        : null,
    };

    const request = await this.leaveRepo.createRequest({
      employeeId: userId,
      leaveType,
      approvedLeaveType: null,
      finalAttendanceCode: null,
      suggestedLeaveType,
      treatmentNote,
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

    await this.sendLeaveAppliedEmails(profile.user, request).catch((err) =>
      console.error('Failed to send leave applied email', (err as Error).message),
    );
    const employeeName = `${profile.user.firstName} ${profile.user.lastName}`;
    await this.notificationService.notifyAdmins(
      'LEAVE_REQUEST',
      'New leave request',
      `${employeeName} applied for ${String(leaveType).replace(/_/g, ' ')} leave.`,
      '/admin/leave',
    ).catch((err) => console.error('Failed to create leave notification', err.message));

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
    await this.notificationService.notifyAdmins(
      'LEAVE_CANCELLED',
      'Leave request cancelled',
      'An employee cancelled a pending leave request.',
      '/admin/leave',
    ).catch((err) => console.error('Failed to create leave notification', err.message));
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
      const filtered = enriched.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(search) ||
          r.employeeCode?.toLowerCase().includes(search),
      );
      return {
        requests: filtered,
        summary: {
          total: filtered.length,
          pending: filtered.filter((r) => r.status === LeaveStatus.PENDING).length,
          approved: filtered.filter((r) => r.status === LeaveStatus.APPROVED).length,
          rejected: filtered.filter((r) => r.status === LeaveStatus.REJECTED).length,
        },
      };
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


  private isPaidLeaveType(type: LeaveType): boolean {
    return type === LeaveType.CL || type === LeaveType.SL || type === LeaveType.EL;
  }

  private async resolveFinalApprovalLeaveType(
    request: LeaveRequest,
    overrideLeaveType?: LeaveType,
  ): Promise<LeaveType> {
    if (overrideLeaveType) return overrideLeaveType;
    if (request.requestMode === RequestMode.PERMISSION || request.leaveType === LeaveType.PERMISSION) {
      return LeaveType.PERMISSION;
    }

    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    const policy = await this.leaveRepo.getPolicy();
    if (!profile || !policy) {
      return request.suggestedLeaveType ?? request.leaveType;
    }

    const inProbation = this.isInProbation(profile.dateOfJoining, policy.probationPeriodMonths);
    if (inProbation && !policy.probationLeaveAllowed && request.leaveType !== LeaveType.LOP) {
      return LeaveType.LOP;
    }
    return request.leaveType;
  }

  private async validateBalanceForApprovedTreatment(
    request: LeaveRequest,
    finalLeaveType: LeaveType,
  ): Promise<void> {
    if (!this.isPaidLeaveType(finalLeaveType) || !request.totalDays) return;
    const summary = await this.getEmployeeSummary(request.employeeId);
    const balanceKey = finalLeaveType.toLowerCase() as 'cl' | 'sl' | 'el';
    const available = summary.balance[balanceKey] ?? 0;
    if (Number(request.totalDays) > available) {
      throw ApiError.badRequest(
        `Insufficient ${finalLeaveType} balance for approval. Available: ${available}, Requested: ${Number(request.totalDays)}`,
        'LEAVE_INSUFFICIENT_BALANCE_APPROVAL',
      );
    }
  }

  private async syncAttendanceForLeaveRequest(request: LeaveRequest) {
    const { startDate, endDate } = this.getRequestRange(request);
    await this.attendanceService.recomputeEmployeeDateRange(request.employeeId, startDate, endDate);
  }

  // ══════════════════════════════════════════════════════
  //  Admin: Approve / Reject / Override
  // ══════════════════════════════════════════════════════

  async approveRequest(
    requestId: string,
    adminId: string,
    remarks?: string,
    approvedLeaveTypeInput?: string,
  ) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');
    if (request.status !== LeaveStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be approved', 'LEAVE_NOT_PENDING');
    }

    const approvedLeaveType = await this.resolveFinalApprovalLeaveType(
      request,
      approvedLeaveTypeInput as LeaveType | undefined,
    );
    if (request.requestMode !== RequestMode.PERMISSION && approvedLeaveType === LeaveType.PERMISSION) {
      throw ApiError.badRequest(
        'Permission treatment can only be used for permission requests',
        'LEAVE_INVALID_FINAL_TREATMENT',
      );
    }
    if (request.requestMode === RequestMode.PERMISSION && approvedLeaveType !== LeaveType.PERMISSION) {
      throw ApiError.badRequest(
        'Permission requests can only be approved as permission',
        'LEAVE_INVALID_FINAL_TREATMENT',
      );
    }
    await this.validateBalanceForApprovedTreatment(request, approvedLeaveType);

    request.status = LeaveStatus.APPROVED;
    request.approvedLeaveType = approvedLeaveType;
    request.finalAttendanceCode = approvedLeaveType;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    if (remarks) request.adminRemarks = remarks;
    await this.leaveRepo.saveRequest(request);
    await this.syncAttendanceForLeaveRequest(request);

    // Send email
    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    if (profile?.user) {
      await this.sendLeaveStatusEmail(profile.user, request, 'approved').catch((err) =>
        console.error('Failed to send approval email', (err as Error).message),
      );
    }
    await this.notificationService.notifyUser(
      request.employeeId,
      'LEAVE_APPROVED',
      'Leave request approved',
      `Your leave request was approved as ${String(approvedLeaveType).replace(/_/g, ' ')}.`,
      '/employee/leave',
    ).catch((err) => console.error('Failed to create leave notification', err.message));

    return this.formatRequest(request, profile?.user);
  }

  async rejectRequest(requestId: string, adminId: string, remarks?: string) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');
    if (request.status !== LeaveStatus.PENDING) {
      throw ApiError.badRequest('Only pending requests can be rejected', 'LEAVE_NOT_PENDING');
    }

    request.status = LeaveStatus.REJECTED;
    request.approvedLeaveType = null;
    request.finalAttendanceCode = null;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    if (remarks) request.adminRemarks = remarks;
    await this.leaveRepo.saveRequest(request);
    await this.syncAttendanceForLeaveRequest(request);

    const profile = await this.employeeRepo.findByUserId(request.employeeId);
    if (profile?.user) {
      await this.sendLeaveStatusEmail(profile.user, request, 'rejected').catch((err) =>
        console.error('Failed to send rejection email', (err as Error).message),
      );
    }
    await this.notificationService.notifyUser(
      request.employeeId,
      'LEAVE_REJECTED',
      'Leave request rejected',
      remarks ? `Your leave request was rejected: ${remarks}` : 'Your leave request was rejected by HR.',
      '/employee/leave',
    ).catch((err) => console.error('Failed to create leave notification', err.message));

    return this.formatRequest(request, profile?.user);
  }

  async overrideRequest(
    requestId: string,
    adminId: string,
    data: { status: string; remarks?: string; leaveType?: string; approvedLeaveType?: string },
  ) {
    const request = await this.leaveRepo.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Leave request not found', 'LEAVE_NOT_FOUND');

    request.status = data.status as LeaveStatus;
    request.approvedBy = request.status === LeaveStatus.PENDING ? null : adminId;
    request.approvedAt = request.status === LeaveStatus.PENDING ? null : new Date();
    if (data.remarks) request.adminRemarks = data.remarks;
    const overrideTypeInput = (data.approvedLeaveType ?? data.leaveType) as LeaveType | undefined;

    if (request.status === LeaveStatus.APPROVED) {
      const approvedLeaveType = await this.resolveFinalApprovalLeaveType(request, overrideTypeInput);
      if (request.requestMode !== RequestMode.PERMISSION && approvedLeaveType === LeaveType.PERMISSION) {
        throw ApiError.badRequest(
          'Permission treatment can only be used for permission requests',
          'LEAVE_INVALID_FINAL_TREATMENT',
        );
      }
      if (request.requestMode === RequestMode.PERMISSION && approvedLeaveType !== LeaveType.PERMISSION) {
        throw ApiError.badRequest(
          'Permission requests can only be approved as permission',
          'LEAVE_INVALID_FINAL_TREATMENT',
        );
      }
      await this.validateBalanceForApprovedTreatment(request, approvedLeaveType);
      request.approvedLeaveType = approvedLeaveType;
      request.finalAttendanceCode = approvedLeaveType;
    } else {
      request.approvedLeaveType = null;
      request.finalAttendanceCode = null;
    }

    await this.leaveRepo.saveRequest(request);
    await this.syncAttendanceForLeaveRequest(request);

    if (request.status === LeaveStatus.APPROVED || request.status === LeaveStatus.REJECTED) {
      const profile = await this.employeeRepo.findByUserId(request.employeeId);
      if (profile?.user) {
        const action = request.status === LeaveStatus.APPROVED ? 'approved' : 'rejected';
        await this.sendLeaveStatusEmail(profile.user, request, action).catch((err) =>
          console.error('Failed to send override status email', (err as Error).message),
        );
      }
      const approved = request.status === LeaveStatus.APPROVED;
      await this.notificationService.notifyUser(
        request.employeeId,
        approved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        approved ? 'Leave request approved' : 'Leave request rejected',
        approved ? 'HR approved your leave request.' : 'HR rejected your leave request.',
        '/employee/leave',
      ).catch((err) => console.error('Failed to create leave notification', err.message));
    }

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
        maxPermissionRequestsPerMonth: Number(policy.maxPermissionRequestsPerMonth),
        maxRegularizationsPerMonth: Number(policy.maxRegularizationsPerMonth),
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
    maxPermissionRequestsPerMonth?: number;
    maxRegularizationsPerMonth?: number;
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
        requestedLeaveType: request.leaveType,
        suggestedLeaveType: request.suggestedLeaveType ?? request.leaveType,
        requestMode: request.requestMode.replace('_', ' '),
        dateRange,
        daysOrHours,
        reason: request.reason,
        treatmentNote: request.treatmentNote || 'Request will follow organization leave policy during approval.',
        status: 'PENDING',
        statusTitle: 'Request received',
        statusMessage: 'Your leave request is now with the HR team for review.',
        statusAccent: '#B7791F',
        statusSoft: '#FFF8E1',
        statusIcon: '... ',
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
        requestedLeaveType: request.leaveType,
        approvedLeaveType: request.approvedLeaveType ?? '-',
        finalAttendanceCode: request.finalAttendanceCode ?? '-',
        requestMode: request.requestMode.replace('_', ' '),
        dateRange,
        daysOrHours,
        status: action.toUpperCase(),
        statusClass: action,
        statusTitle: action === 'approved' ? 'Your leave is approved' : 'Your leave was not approved',
        statusMessage: action === 'approved'
          ? 'Your request has been reviewed and approved by HR.'
          : 'Your request has been reviewed and rejected by HR.',
        statusAccent: action === 'approved' ? '#0D7C47' : '#C41E3A',
        statusSoft: action === 'approved' ? '#E6F9F0' : '#FEE7E7',
        statusIcon: action === 'approved' ? 'OK' : '!',
        adminRemarks: request.adminRemarks || 'No remarks',
        year: new Date().getFullYear().toString(),
      },
    );
  }

  private getDateRangeString(request: LeaveRequest): string {
    const formatDate = (value: string | null): string => {
      if (!value) return '-';
      return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    };
    if (request.requestMode === RequestMode.FULL_DAY) {
      return request.startDate === request.endDate
        ? formatDate(request.startDate)
        : `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;
    }
    if (request.requestMode === RequestMode.HALF_DAY) {
      return `${formatDate(request.date)} (${request.halfDaySession === HalfDaySession.FN ? 'First half' : 'Second half'})`;
    }
    return `${formatDate(request.date)} (${request.fromTime?.slice(0, 5)} - ${request.toTime?.slice(0, 5)})`;
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
      requestedLeaveType: r.leaveType,
      approvedLeaveType: r.approvedLeaveType,
      finalAttendanceCode: r.finalAttendanceCode,
      suggestedLeaveType: r.suggestedLeaveType,
      treatmentNote: r.treatmentNote,
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
