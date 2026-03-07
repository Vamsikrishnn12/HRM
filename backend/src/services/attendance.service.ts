import { AttendanceRepository } from '../repositories/attendance.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { Attendance, AttendanceStatus } from '../entities/Attendance.entity';
import { PunchType, PunchSource } from '../entities/AttendancePunch.entity';
import { AlternateSaturdayRule, OrgSettings } from '../entities/OrgSettings.entity';
import { LocationService } from './location.service';
import { ApiError } from '../utils/apiError';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';

interface LocationInput {
  latitude?: number;
  longitude?: number;
}

export class AttendanceService {
  private repo: AttendanceRepository;
  private settingsRepo: SettingsRepository;

  constructor() {
    this.repo = new AttendanceRepository();
    this.settingsRepo = new SettingsRepository();
  }

  // ════════════════════════════════════════════════════════
  // Employee: Get today's state (backend-driven)
  // ════════════════════════════════════════════════════════
  async getTodayAttendance(employeeId: string) {
    const today = this.todayDateString();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const record = await this.repo.findByEmployeeAndDate(employeeId, today);
    const dayType = await this.getDayType(today, settings);

    // Check approved leave
    const leaves = await this.repo.findApprovedLeavesForDate(today);
    const hasLeave = leaves.some((l) => l.employeeId === employeeId);

    const windowMinutes = (settings as any).checkInWindowMinutes ?? 10;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.timeToMinutes(settings.workStartTime);
    const windowEnd = startMinutes + windowMinutes;

    const hasCheckedIn = !!(record && record.firstCheckInAt);

    // Determine override state
    const overrideActive = !!(
      record?.startWorkOverrideEnabled &&
      (!record.overrideValidUntil || new Date(record.overrideValidUntil) > now)
    );

    // Compute canStartWork
    let canStartWork = false;
    let reasonCode = '';
    let reasonMessage = '';

    if (dayType === 'HOLIDAY') {
      reasonCode = 'HOLIDAY';
      reasonMessage = 'Today is a holiday';
    } else if (dayType === 'WEEK_OFF') {
      reasonCode = 'WEEK_OFF';
      reasonMessage = 'Today is a week off';
    } else if (hasLeave) {
      reasonCode = 'ON_LEAVE';
      reasonMessage = 'You are on approved leave today';
    } else if (hasCheckedIn) {
      reasonCode = 'ALREADY_STARTED';
      reasonMessage = 'You have already started work today';
    } else if (overrideActive) {
      canStartWork = true;
      reasonCode = 'OVERRIDE_ACTIVE';
      reasonMessage = 'Admin has re-enabled start work for you';
    } else if (currentMinutes < startMinutes) {
      reasonCode = 'BEFORE_START_TIME';
      reasonMessage = `Work can be started after ${this.formatTime12h(settings.workStartTime)}`;
    } else if (currentMinutes <= windowEnd) {
      canStartWork = true;
      reasonCode = 'WITHIN_WINDOW';
      reasonMessage = 'You can start work now';
    } else {
      reasonCode = 'WINDOW_EXPIRED';
      reasonMessage = 'Check-in window has expired. Please contact your admin.';
    }

    // Compute today status
    let todayStatus: string;
    if (dayType === 'HOLIDAY') todayStatus = 'HOLIDAY';
    else if (dayType === 'WEEK_OFF') todayStatus = 'WEEK_OFF';
    else if (hasLeave) todayStatus = 'LEAVE';
    else if (record) todayStatus = record.status;
    else if (currentMinutes <= windowEnd) todayStatus = 'NOT_STARTED';
    else todayStatus = 'MISSED_CHECK_IN';

    return {
      date: today,
      dayType,
      workStartTime: settings.workStartTime,
      workEndTime: settings.workEndTime,
      lateGraceMinutes: settings.lateGraceMinutes,
      checkInWindowMinutes: windowMinutes,
      canStartWork,
      reasonCode,
      reasonMessage,
      todayStatus,
      overrideActive,
      isTooLate: reasonCode === 'WINDOW_EXPIRED' && !overrideActive,
      attendance: record ? this.formatAttendance(record) : null,
    };
  }

  // ════════════════════════════════════════════════════════
  // Employee: Start Work (Check-in)
  // ════════════════════════════════════════════════════════
  async startWork(employeeId: string, location: LocationInput) {
    const today = this.todayDateString();
    const now = new Date();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const dayType = await this.getDayType(today, settings);

    if (dayType === 'HOLIDAY') {
      throw ApiError.badRequest('Today is a holiday', 'ATTENDANCE_HOLIDAY');
    }
    if (dayType === 'WEEK_OFF') {
      throw ApiError.badRequest('Today is a week off', 'ATTENDANCE_WEEK_OFF');
    }

    const windowMinutes = (settings as any).checkInWindowMinutes ?? 10;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.timeToMinutes(settings.workStartTime);
    const windowEnd = startMinutes + windowMinutes;

    // Check for existing record and override
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today);

    const overrideActive = !!(
      existing?.startWorkOverrideEnabled &&
      (!existing.overrideValidUntil || new Date(existing.overrideValidUntil) > now)
    );

    if (existing && existing.firstCheckInAt) {
      throw ApiError.badRequest('You have already started work today', 'ATTENDANCE_ALREADY_STARTED');
    }

    // Time window check — allow if override is active
    if (!overrideActive) {
      if (currentMinutes < startMinutes) {
        throw ApiError.badRequest(
          `Work can be started only after ${this.formatTime12h(settings.workStartTime)}`,
          'ATTENDANCE_START_NOT_ALLOWED',
        );
      }
      if (currentMinutes > windowEnd) {
        throw ApiError.badRequest(
          'Check-in window has expired. Please contact your admin for regularization.',
          'ATTENDANCE_TOO_LATE',
        );
      }
    }

    // Validate location
    let isInsideOffice = false;
    let locationValidated = false;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: employeeId } });

    if (user?.officeLocationRequired) {
      if (!location.latitude || !location.longitude) {
        throw ApiError.badRequest(
          'Location is required for office-based employees',
          'ATTENDANCE_LOCATION_REQUIRED',
        );
      }

      const officeLat = user.officeLatitude ?? (settings.officeLatitude ? parseFloat(String(settings.officeLatitude)) : null);
      const officeLng = user.officeLongitude ?? (settings.officeLongitude ? parseFloat(String(settings.officeLongitude)) : null);
      const radius = user.officeRadiusMeters ?? settings.officeRadiusMeters;

      if (officeLat && officeLng && radius) {
        isInsideOffice = LocationService.isWithinRadius(
          officeLat, officeLng, location.latitude, location.longitude, radius,
        );
        locationValidated = true;

        if (!isInsideOffice) {
          throw ApiError.badRequest(
            'You are not within the allowed office radius',
            'ATTENDANCE_OUTSIDE_OFFICE',
          );
        }
      }
    }

    // Calculate late minutes (from grace end, not window end)
    const graceEnd = startMinutes + settings.lateGraceMinutes;
    const lateMinutes = Math.max(0, currentMinutes - graceEnd);
    const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    await this.repo.createPunch({
      employeeId,
      type: PunchType.CHECK_IN,
      time: now,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      isInsideOffice,
      source: PunchSource.WEB,
    });

    if (existing) {
      existing.firstCheckInAt = now;
      existing.status = status;
      existing.lateMinutes = lateMinutes;
      existing.locationValidated = locationValidated;
      existing.checkInLatitude = location.latitude ?? null;
      existing.checkInLongitude = location.longitude ?? null;
      // Clear override after use
      if (existing.startWorkOverrideEnabled) {
        existing.startWorkOverrideEnabled = false;
      }
      await this.repo.saveAttendance(existing);
      const updated = await this.repo.findByEmployeeAndDate(employeeId, today);
      return this.formatAttendance(updated!);
    }

    const attendance = await this.repo.createAttendance({
      employeeId,
      date: today,
      firstCheckInAt: now,
      status,
      lateMinutes,
      locationValidated,
      checkInLatitude: location.latitude ?? null,
      checkInLongitude: location.longitude ?? null,
    });

    return this.formatAttendance(attendance);
  }

  // ════════════════════════════════════════════════════════
  // Employee: End Work (Check-out)
  // ════════════════════════════════════════════════════════
  async endWork(employeeId: string, location: LocationInput & { eodDescription?: string }) {
    const today = this.todayDateString();
    const now = new Date();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const record = await this.repo.findByEmployeeAndDate(employeeId, today);
    if (!record || !record.firstCheckInAt) {
      throw ApiError.badRequest('You have not started work today', 'ATTENDANCE_NOT_STARTED');
    }

    if (record.lastCheckOutAt) {
      throw ApiError.badRequest('You have already ended work today', 'ATTENDANCE_ALREADY_ENDED');
    }

    let isInsideOffice = false;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: employeeId } });

    if (user?.officeLocationRequired && location.latitude && location.longitude) {
      const officeLat = user.officeLatitude ?? (settings.officeLatitude ? parseFloat(String(settings.officeLatitude)) : null);
      const officeLng = user.officeLongitude ?? (settings.officeLongitude ? parseFloat(String(settings.officeLongitude)) : null);
      const radius = user.officeRadiusMeters ?? settings.officeRadiusMeters;

      if (officeLat && officeLng && radius) {
        isInsideOffice = LocationService.isWithinRadius(
          officeLat, officeLng, location.latitude, location.longitude, radius,
        );
      }
    }

    await this.repo.createPunch({
      employeeId,
      type: PunchType.CHECK_OUT,
      time: now,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      isInsideOffice,
      source: PunchSource.WEB,
    });

    const checkInTime = new Date(record.firstCheckInAt).getTime();
    const totalWorkMinutes = Math.floor((now.getTime() - checkInTime) / 60000);

    let status = record.status;
    if (totalWorkMinutes < settings.halfDayMinMinutes) {
      status = AttendanceStatus.ABSENT;
    } else if (totalWorkMinutes < settings.fullDayMinMinutes) {
      status = AttendanceStatus.HALF_DAY;
    }

    record.lastCheckOutAt = now;
    record.totalWorkMinutes = totalWorkMinutes;
    record.status = status;
    record.eodDescription = location.eodDescription ?? null;
    record.checkOutLatitude = location.latitude ?? null;
    record.checkOutLongitude = location.longitude ?? null;

    await this.repo.saveAttendance(record);
    const updated = await this.repo.findByEmployeeAndDate(employeeId, today);
    return this.formatAttendance(updated!);
  }

  // ════════════════════════════════════════════════════════
  // Employee: History
  // ════════════════════════════════════════════════════════
  async getHistory(employeeId: string, days = 30) {
    const endDate = this.todayDateString();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().split('T')[0];

    const records = await this.repo.findByEmployeeHistory(employeeId, startDate, endDate);
    return records.map((r) => this.formatAttendance(r));
  }

  // ════════════════════════════════════════════════════════
  // Admin: Full daily attendance roster
  // ════════════════════════════════════════════════════════
  async getAdminAttendance(date: string, status?: string, search?: string) {
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const dayType = await this.getDayType(date, settings);
    const windowMinutes = (settings as any).checkInWindowMinutes ?? 10;
    const startMinutes = this.timeToMinutes(settings.workStartTime);
    const windowEnd = startMinutes + windowMinutes;

    // Determine if check-in window is expired for this date
    const now = new Date();
    const today = this.todayDateString();
    const isToday = date === today;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const windowExpired = !isToday || currentMinutes > windowEnd;

    // Gather all data in parallel
    const [employees, attendanceMap, approvedLeaves] = await Promise.all([
      this.repo.findAllActiveEmployees(),
      this.repo.findAttendanceMapByDate(date),
      this.repo.findApprovedLeavesForDate(date),
    ]);

    // Build leave set
    const leaveEmployeeIds = new Set(approvedLeaves.map((l) => l.employeeId));

    // Build roster
    const roster: any[] = [];
    const summaryMap: Record<string, number> = {
      PRESENT: 0, LATE: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0,
      HOLIDAY: 0, WEEK_OFF: 0, NOT_STARTED: 0, MISSED_CHECK_IN: 0,
    };

    for (const emp of employees) {
      const att = attendanceMap.get(emp.id);

      let computedStatus: string;

      if (dayType === 'HOLIDAY') {
        computedStatus = 'HOLIDAY';
      } else if (dayType === 'WEEK_OFF') {
        computedStatus = 'WEEK_OFF';
      } else if (leaveEmployeeIds.has(emp.id)) {
        computedStatus = 'LEAVE';
      } else if (att) {
        // Use the real attendance status (including manual overrides)
        computedStatus = att.status;
      } else if (!windowExpired) {
        computedStatus = 'NOT_STARTED';
      } else {
        computedStatus = 'MISSED_CHECK_IN';
      }

      summaryMap[computedStatus] = (summaryMap[computedStatus] ?? 0) + 1;

      const record = {
        id: att?.id ?? null,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.empId ?? null,
        date,
        firstCheckInAt: att?.firstCheckInAt ?? null,
        lastCheckOutAt: att?.lastCheckOutAt ?? null,
        totalWorkMinutes: att?.totalWorkMinutes ?? 0,
        status: computedStatus,
        lateMinutes: att?.lateMinutes ?? 0,
        isManualOverride: att?.isManualOverride ?? false,
        overrideReason: att?.overrideReason ?? null,
        locationValidated: att?.locationValidated ?? false,
        eodDescription: att?.eodDescription ?? null,
        startWorkOverrideEnabled: att?.startWorkOverrideEnabled ?? false,
        overrideActive: !!(
          att?.startWorkOverrideEnabled &&
          (!att.overrideValidUntil || new Date(att.overrideValidUntil) > now)
        ),
        checkInLatitude: att?.checkInLatitude ? parseFloat(String(att.checkInLatitude)) : null,
        checkInLongitude: att?.checkInLongitude ? parseFloat(String(att.checkInLongitude)) : null,
        checkOutLatitude: att?.checkOutLatitude ? parseFloat(String(att.checkOutLatitude)) : null,
        checkOutLongitude: att?.checkOutLongitude ? parseFloat(String(att.checkOutLongitude)) : null,
      };

      roster.push(record);
    }

    // Apply filters
    let filtered = roster;

    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(s) ||
          r.employeeCode?.toLowerCase().includes(s),
      );
    }

    // Recompute summary from filtered set only if not filtering
    return {
      summary: summaryMap,
      records: filtered,
    };
  }

  // ════════════════════════════════════════════════════════
  // Admin: Get attendance for a specific employee
  // ════════════════════════════════════════════════════════
  async getAdminEmployeeAttendance(employeeId: string, days = 30) {
    return this.getHistory(employeeId, days);
  }

  // ════════════════════════════════════════════════════════
  // Admin: Override status (create record if missing)
  // ════════════════════════════════════════════════════════
  async overrideStatus(
    employeeId: string,
    date: string,
    status: AttendanceStatus,
    reason: string,
  ) {
    const record = await this.repo.upsertAttendance(employeeId, date, {
      status,
      isManualOverride: true,
      overrideReason: reason,
    });

    // Reload with employee relation
    const updated = await this.repo.findById(record.id);
    return this.formatAttendanceAdmin(updated!);
  }

  // ════════════════════════════════════════════════════════
  // Admin: Manual entry (create record if missing)
  // ════════════════════════════════════════════════════════
  async manualEntry(
    employeeId: string,
    date: string,
    data: {
      firstCheckInAt?: string;
      lastCheckOutAt?: string;
      status?: AttendanceStatus;
      reason?: string;
    },
  ) {
    let record = await this.repo.findByEmployeeAndDate(employeeId, date);

    if (!record) {
      record = await this.repo.createAttendance({
        employeeId,
        date,
        status: data.status ?? AttendanceStatus.PRESENT,
        isManualOverride: true,
        overrideReason: data.reason ?? 'Manual entry by admin',
      });
    }

    if (data.firstCheckInAt) record.firstCheckInAt = new Date(data.firstCheckInAt);
    if (data.lastCheckOutAt) record.lastCheckOutAt = new Date(data.lastCheckOutAt);
    if (data.status) record.status = data.status;

    if (record.firstCheckInAt && record.lastCheckOutAt) {
      const checkIn = new Date(record.firstCheckInAt).getTime();
      const checkOut = new Date(record.lastCheckOutAt).getTime();
      record.totalWorkMinutes = Math.floor((checkOut - checkIn) / 60000);
    }

    record.isManualOverride = true;
    record.overrideReason = data.reason ?? 'Manual entry by admin';
    await this.repo.saveAttendance(record);

    const updated = await this.repo.findById(record.id);
    return this.formatAttendanceAdmin(updated!);
  }

  // ════════════════════════════════════════════════════════
  // Admin: Re-enable Start Work for an employee
  // ════════════════════════════════════════════════════════
  async reEnableStartWork(
    employeeId: string,
    adminId: string,
    data: { reason?: string; validUntil?: string },
  ) {
    const today = this.todayDateString();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const dayType = await this.getDayType(today, settings);
    if (dayType === 'HOLIDAY') {
      throw ApiError.badRequest('Cannot enable start work on a holiday', 'ATTENDANCE_OVERRIDE_NOT_ALLOWED');
    }
    if (dayType === 'WEEK_OFF') {
      throw ApiError.badRequest('Cannot enable start work on a week off', 'ATTENDANCE_OVERRIDE_NOT_ALLOWED');
    }

    // Default valid until end of work day
    const endOfDay = new Date();
    const [endH, endM] = settings.workEndTime.split(':').map(Number);
    endOfDay.setHours(endH, endM, 0, 0);

    const validUntil = data.validUntil ? new Date(data.validUntil) : endOfDay;

    const record = await this.repo.upsertAttendance(employeeId, today, {
      startWorkOverrideEnabled: true,
      overrideValidUntil: validUntil,
      overrideSetBy: adminId,
      overrideSetAt: new Date(),
      overrideReason: data.reason ?? 'Admin re-enabled start work',
    });

    // If status was MISSED_CHECK_IN or NOT_STARTED from computed, but the actual
    // DB record might have ABSENT default — keep it until employee checks in
    if (record.status === AttendanceStatus.ABSENT && !record.firstCheckInAt) {
      record.status = AttendanceStatus.NOT_STARTED;
      await this.repo.saveAttendance(record);
    }

    const updated = await this.repo.findById(record.id);
    return {
      employeeId,
      date: today,
      startWorkOverrideEnabled: true,
      overrideValidUntil: validUntil,
      attendance: updated ? this.formatAttendanceAdmin(updated) : null,
    };
  }

  // ════════════════════════════════════════════════════════
  // Helper: Determine day type
  // ════════════════════════════════════════════════════════
  async getDayType(date: string, settings: any): Promise<'WORKING' | 'HOLIDAY' | 'WEEK_OFF'> {
    const holiday = await this.settingsRepo.findHolidayByDate(date);
    if (holiday) return 'HOLIDAY';

    const d = new Date(date + 'T00:00:00');
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[d.getDay()];

    const weekOffDays = (settings.weekOffDays || '')
      .split(',')
      .map((s: string) => s.trim().toUpperCase());

    if (weekOffDays.includes(dayName)) {
      if (dayName === 'SATURDAY' && settings.alternateSaturdayOffRule !== AlternateSaturdayRule.NONE) {
        const weekNum = this.getWeekOfMonth(d);
        if (settings.alternateSaturdayOffRule === AlternateSaturdayRule.SECOND_FOURTH) {
          if (weekNum === 2 || weekNum === 4) return 'WEEK_OFF';
          return 'WORKING';
        }
        if (settings.alternateSaturdayOffRule === AlternateSaturdayRule.FIRST_THIRD) {
          if (weekNum === 1 || weekNum === 3) return 'WEEK_OFF';
          return 'WORKING';
        }
      }
      return 'WEEK_OFF';
    }

    if (dayName === 'SATURDAY' && settings.alternateSaturdayOffRule !== AlternateSaturdayRule.NONE) {
      const weekNum = this.getWeekOfMonth(d);
      if (settings.alternateSaturdayOffRule === AlternateSaturdayRule.SECOND_FOURTH) {
        if (weekNum === 2 || weekNum === 4) return 'WEEK_OFF';
      }
      if (settings.alternateSaturdayOffRule === AlternateSaturdayRule.FIRST_THIRD) {
        if (weekNum === 1 || weekNum === 3) return 'WEEK_OFF';
      }
    }

    return 'WORKING';
  }

  private getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let count = 0;
    for (let d = firstDay; d <= date; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === date.getDay()) count++;
    }
    return count;
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  private formatTime12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hours = h % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  private todayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private formatAttendance(a: Attendance) {
    return {
      id: a.id,
      employeeId: a.employeeId,
      date: a.date,
      firstCheckInAt: a.firstCheckInAt,
      lastCheckOutAt: a.lastCheckOutAt,
      totalWorkMinutes: a.totalWorkMinutes,
      status: a.status,
      lateMinutes: a.lateMinutes,
      isManualOverride: a.isManualOverride,
      locationValidated: a.locationValidated,
      eodDescription: a.eodDescription,
    };
  }

  private formatAttendanceAdmin(a: Attendance) {
    const emp = a.employee;
    return {
      id: a.id,
      employeeId: a.employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : null,
      employeeCode: emp?.empId ?? null,
      date: a.date,
      firstCheckInAt: a.firstCheckInAt,
      lastCheckOutAt: a.lastCheckOutAt,
      totalWorkMinutes: a.totalWorkMinutes,
      status: a.status,
      lateMinutes: a.lateMinutes,
      isManualOverride: a.isManualOverride,
      overrideReason: a.overrideReason,
      locationValidated: a.locationValidated,
      eodDescription: a.eodDescription,
      startWorkOverrideEnabled: a.startWorkOverrideEnabled ?? false,
      checkInLatitude: a.checkInLatitude ? parseFloat(String(a.checkInLatitude)) : null,
      checkInLongitude: a.checkInLongitude ? parseFloat(String(a.checkInLongitude)) : null,
      checkOutLatitude: a.checkOutLatitude ? parseFloat(String(a.checkOutLatitude)) : null,
      checkOutLongitude: a.checkOutLongitude ? parseFloat(String(a.checkOutLongitude)) : null,
    };
  }
}
