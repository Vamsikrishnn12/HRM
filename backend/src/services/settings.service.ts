import { SettingsRepository } from '../repositories/settings.repository';
import { ApiError } from '../utils/apiError';

interface UpdateSettingsInput {
  companyName?: string;
  companyAddress?: string | null;
  workStartTime?: string;
  workEndTime?: string;
  lateGraceMinutes?: number;
  halfDayMinMinutes?: number;
  fullDayMinMinutes?: number;
  weekOffDays?: string;
  alternateSaturdayOffRule?: string;
  officeLatitude?: number | null;
  officeLongitude?: number | null;
  officeRadiusMeters?: number | null;
  geoFenceRequired?: boolean;
  allowRemoteAttendance?: boolean;
}

interface HolidayInput {
  date: string;
  name: string;
}

export class SettingsService {
  private repo: SettingsRepository;

  constructor() {
    this.repo = new SettingsRepository();
  }

  async getSettings() {
    let settings = await this.repo.getSettings();
    if (!settings) {
      settings = await this.repo.upsertSettings({});
    }
    return this.formatSettings(settings);
  }

  async updateSettings(input: UpdateSettingsInput) {
    const existing = await this.repo.getSettings();
    const merged = {
      ...(existing ?? {}),
      ...input,
    } as Partial<UpdateSettingsInput>;

    const isAccessUpdate =
      Object.prototype.hasOwnProperty.call(input, 'officeLatitude') ||
      Object.prototype.hasOwnProperty.call(input, 'officeLongitude') ||
      Object.prototype.hasOwnProperty.call(input, 'officeRadiusMeters') ||
      Object.prototype.hasOwnProperty.call(input, 'geoFenceRequired') ||
      Object.prototype.hasOwnProperty.call(input, 'allowRemoteAttendance');

    if (isAccessUpdate) {
      const geoFenceRequired = Boolean(merged.geoFenceRequired);
      const allowRemoteAttendance = Boolean(merged.allowRemoteAttendance);

      if (!geoFenceRequired && !allowRemoteAttendance) {
        throw ApiError.badRequest(
          'At least one attendance access mode must be enabled (Geo-fence or Remote)',
          'ATTENDANCE_ACCESS_MODE_REQUIRED',
        );
      }

      if (geoFenceRequired) {
        const hasValidLatitude =
          merged.officeLatitude != null && Number.isFinite(Number(merged.officeLatitude));
        const hasValidLongitude =
          merged.officeLongitude != null && Number.isFinite(Number(merged.officeLongitude));
        const hasValidRadius =
          merged.officeRadiusMeters != null && Number(merged.officeRadiusMeters) > 0;

        if (!hasValidLatitude || !hasValidLongitude || !hasValidRadius) {
          throw ApiError.badRequest(
            'Latitude, longitude, and radius are required when geo-fence is enabled',
            'GEOFENCE_LOCATION_REQUIRED',
          );
        }
      }
    }

    const settings = await this.repo.upsertSettings(input as any);
    return this.formatSettings(settings);
  }

  // ── Holidays ──

  async listHolidays() {
    const holidays = await this.repo.findAllHolidays();
    return {
      data: holidays.map((h) => this.formatHoliday(h)),
      total: holidays.length,
    };
  }

  async createHoliday(input: HolidayInput) {
    const existing = await this.repo.findHolidayByDate(input.date);
    if (existing) {
      throw ApiError.conflict(
        `A holiday already exists on ${input.date}`,
        'HOLIDAY_DUPLICATE_DATE',
      );
    }
    const holiday = await this.repo.createHoliday(input);
    return this.formatHoliday(holiday);
  }

  async updateHoliday(id: string, input: HolidayInput) {
    const existing = await this.repo.findHolidayById(id);
    if (!existing) {
      throw ApiError.notFound('Holiday not found', 'HOLIDAY_NOT_FOUND');
    }

    // Check duplicate date (excluding current)
    const duplicate = await this.repo.findHolidayByDate(input.date);
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict(
        `A holiday already exists on ${input.date}`,
        'HOLIDAY_DUPLICATE_DATE',
      );
    }

    await this.repo.updateHoliday(id, input);
    const updated = await this.repo.findHolidayById(id);
    return this.formatHoliday(updated!);
  }

  async deleteHoliday(id: string) {
    const existing = await this.repo.findHolidayById(id);
    if (!existing) {
      throw ApiError.notFound('Holiday not found', 'HOLIDAY_NOT_FOUND');
    }
    await this.repo.deleteHoliday(id);
  }

  private formatSettings(s: any) {
    return {
      id: s.id,
      companyName: s.companyName || 'HRMS',
      companyAddress: s.companyAddress || '',
      workStartTime: s.workStartTime,
      workEndTime: s.workEndTime,
      lateGraceMinutes: s.lateGraceMinutes,
      halfDayMinMinutes: s.halfDayMinMinutes,
      fullDayMinMinutes: s.fullDayMinMinutes,
      weekOffDays: s.weekOffDays,
      alternateSaturdayOffRule: s.alternateSaturdayOffRule,
      officeLatitude: s.officeLatitude != null ? parseFloat(s.officeLatitude) : null,
      officeLongitude: s.officeLongitude != null ? parseFloat(s.officeLongitude) : null,
      officeRadiusMeters: s.officeRadiusMeters,
      geoFenceRequired: s.geoFenceRequired ?? true,
      allowRemoteAttendance: s.allowRemoteAttendance ?? false,
      updatedAt: s.updatedAt,
    };
  }

  private formatHoliday(h: any) {
    return {
      id: h.id,
      date: h.date,
      name: h.name,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    };
  }
}
