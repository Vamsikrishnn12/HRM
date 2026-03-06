import { AttendanceRepository } from '../repositories/attendance.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { Attendance, AttendanceStatus } from '../entities/Attendance.entity';
import { PunchType, PunchSource } from '../entities/AttendancePunch.entity';
import { AlternateSaturdayRule } from '../entities/OrgSettings.entity';
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

  // ── Employee: Get today's attendance ──
  async getTodayAttendance(employeeId: string) {
    const today = this.todayDateString();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const record = await this.repo.findByEmployeeAndDate(employeeId, today);
    const dayType = await this.getDayType(today, settings);
    const canStart = this.canStartWork(settings.workStartTime, dayType);
    const isTooLate = this.isTooLateToStart(settings.workStartTime, settings.lateGraceMinutes, dayType);

    return {
      date: today,
      dayType,
      workStartTime: settings.workStartTime,
      workEndTime: settings.workEndTime,
      lateGraceMinutes: settings.lateGraceMinutes,
      canStartWork: canStart && !isTooLate,
      isTooLate,
      attendance: record ? this.formatAttendance(record) : null,
    };
  }

  // ── Employee: Start Work (Check-in) ──
  async startWork(employeeId: string, location: LocationInput) {
    const today = this.todayDateString();
    const now = new Date();
    const settings = await this.settingsRepo.getSettings();
    if (!settings) throw ApiError.internal('Organisation settings not configured');

    const dayType = await this.getDayType(today, settings);

    // Block check-in on non-working days
    if (dayType === 'HOLIDAY') {
      throw ApiError.badRequest('Today is a holiday', 'ATTENDANCE_HOLIDAY');
    }
    if (dayType === 'WEEK_OFF') {
      throw ApiError.badRequest('Today is a week off', 'ATTENDANCE_WEEK_OFF');
    }

    // Check work start time
    if (!this.canStartWork(settings.workStartTime, dayType)) {
      throw ApiError.badRequest(
        `Work can be started only after ${this.formatTime12h(settings.workStartTime)}`,
        'ATTENDANCE_START_NOT_ALLOWED',
      );
    }

    // Block if too late (past grace period)
    if (this.isTooLateToStart(settings.workStartTime, settings.lateGraceMinutes, dayType)) {
      throw ApiError.badRequest(
        'You are late and marked as absent. Please contact your admin for regularization.',
        'ATTENDANCE_TOO_LATE',
      );
    }

    // Check if already checked in today
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today);
    if (existing && existing.firstCheckInAt) {
      throw ApiError.badRequest('You have already started work today', 'ATTENDANCE_ALREADY_STARTED');
    }

    // Validate location if user requires it
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
          officeLat,
          officeLng,
          location.latitude,
          location.longitude,
          radius,
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

    // Calculate late status
    const workStartMinutes = this.timeToMinutes(settings.workStartTime);
    const checkInMinutes = now.getHours() * 60 + now.getMinutes();
    const graceEnd = workStartMinutes + settings.lateGraceMinutes;
    const lateMinutes = Math.max(0, checkInMinutes - graceEnd);
    const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    // Create punch record
    await this.repo.createPunch({
      employeeId,
      type: PunchType.CHECK_IN,
      time: now,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      isInsideOffice,
      source: PunchSource.WEB,
    });

    // Create or update attendance record
    if (existing) {
      existing.firstCheckInAt = now;
      existing.status = status;
      existing.lateMinutes = lateMinutes;
      existing.locationValidated = locationValidated;
      existing.checkInLatitude = location.latitude ?? null;
      existing.checkInLongitude = location.longitude ?? null;
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

  // ── Employee: End Work (Check-out) ──
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

    // Create check-out punch
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

    // Compute total worked minutes
    const checkInTime = new Date(record.firstCheckInAt).getTime();
    const totalWorkMinutes = Math.floor((now.getTime() - checkInTime) / 60000);

    // Determine final status based on work minutes
    let status = record.status; // preserve PRESENT/LATE
    if (totalWorkMinutes < settings.halfDayMinMinutes) {
      // Less than half-day minimum → ABSENT
      status = AttendanceStatus.ABSENT;
    } else if (totalWorkMinutes < settings.fullDayMinMinutes) {
      // Between half-day and full-day → HALF_DAY
      status = AttendanceStatus.HALF_DAY;
    }
    // Otherwise keep PRESENT / LATE based on check-in time

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

  // ── Employee: History ──
  async getHistory(employeeId: string, days = 30) {
    const endDate = this.todayDateString();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().split('T')[0];

    const records = await this.repo.findByEmployeeHistory(employeeId, startDate, endDate);
    return records.map((r) => this.formatAttendance(r));
  }

  // ── Admin: Get all attendance for a date ──
  async getAdminAttendance(date: string, status?: string, search?: string) {
    const statusEnum = status ? (status as AttendanceStatus) : undefined;
    const records = await this.repo.findByDateFiltered(date, statusEnum, search);
    const summary = await this.repo.getDateSummary(date);

    return {
      summary,
      records: records.map((r) => this.formatAttendanceAdmin(r)),
    };
  }

  // ── Admin: Get attendance for a specific employee ──
  async getAdminEmployeeAttendance(employeeId: string, days = 30) {
    return this.getHistory(employeeId, days);
  }

  // ── Admin: Override status ──
  async overrideStatus(
    attendanceId: string,
    status: AttendanceStatus,
    reason: string,
  ) {
    const record = await this.repo.findById(attendanceId);
    if (!record) {
      throw ApiError.notFound('Attendance record not found', 'ATTENDANCE_NOT_FOUND');
    }

    record.status = status;
    record.isManualOverride = true;
    record.overrideReason = reason;
    await this.repo.saveAttendance(record);

    const updated = await this.repo.findById(attendanceId);
    return this.formatAttendanceAdmin(updated!);
  }

  // ── Admin: Manual entry ──
  async manualEntry(
    attendanceId: string,
    data: {
      firstCheckInAt?: string;
      lastCheckOutAt?: string;
      status?: AttendanceStatus;
      reason?: string;
    },
  ) {
    const record = await this.repo.findById(attendanceId);
    if (!record) {
      throw ApiError.notFound('Attendance record not found', 'ATTENDANCE_NOT_FOUND');
    }

    if (data.firstCheckInAt) {
      record.firstCheckInAt = new Date(data.firstCheckInAt);
    }
    if (data.lastCheckOutAt) {
      record.lastCheckOutAt = new Date(data.lastCheckOutAt);
    }
    if (data.status) {
      record.status = data.status;
    }

    // Recalculate total work minutes if both times are present
    if (record.firstCheckInAt && record.lastCheckOutAt) {
      const checkIn = new Date(record.firstCheckInAt).getTime();
      const checkOut = new Date(record.lastCheckOutAt).getTime();
      record.totalWorkMinutes = Math.floor((checkOut - checkIn) / 60000);
    }

    record.isManualOverride = true;
    record.overrideReason = data.reason ?? 'Manual entry by admin';
    await this.repo.saveAttendance(record);

    const updated = await this.repo.findById(attendanceId);
    return this.formatAttendanceAdmin(updated!);
  }

  // ── Helper: Determine day type ──
  async getDayType(
    date: string,
    settings: any,
  ): Promise<'WORKING' | 'HOLIDAY' | 'WEEK_OFF'> {
    // Check holiday
    const holiday = await this.settingsRepo.findHolidayByDate(date);
    if (holiday) return 'HOLIDAY';

    // Check week off
    const d = new Date(date + 'T00:00:00');
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[d.getDay()];

    const weekOffDays = (settings.weekOffDays || '')
      .split(',')
      .map((s: string) => s.trim().toUpperCase());

    if (weekOffDays.includes(dayName)) {
      // Handle alternate Saturday
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

    // Also handle Saturday alternate rule even if SATURDAY is not in weekOffDays
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

  // ── Helper: Can employee start work ──
  private canStartWork(workStartTime: string, dayType: string): boolean {
    if (dayType !== 'WORKING') return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.timeToMinutes(workStartTime);
    return currentMinutes >= startMinutes;
  }

  // ── Helper: Is employee too late to start (past grace period) ──
  private isTooLateToStart(workStartTime: string, graceMinutes: number, dayType: string): boolean {
    if (dayType !== 'WORKING') return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.timeToMinutes(workStartTime);
    // Too late = current time exceeds work start + grace
    return currentMinutes > startMinutes + graceMinutes;
  }

  // ── Helper: Get week number of month ──
  private getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let count = 0;
    for (let d = firstDay; d <= date; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === date.getDay()) count++;
    }
    return count;
  }

  // ── Helper: Time string to minutes ──
  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  // ── Helper: Format time 12h ──
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
      checkInLatitude: a.checkInLatitude ? parseFloat(String(a.checkInLatitude)) : null,
      checkInLongitude: a.checkInLongitude ? parseFloat(String(a.checkInLongitude)) : null,
      checkOutLatitude: a.checkOutLatitude ? parseFloat(String(a.checkOutLatitude)) : null,
      checkOutLongitude: a.checkOutLongitude ? parseFloat(String(a.checkOutLongitude)) : null,
    };
  }
}
