import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrgSettings } from '../entities/OrgSettings.entity';
import { Holiday } from '../entities/Holiday.entity';

export class SettingsRepository {
  private settingsRepo: Repository<OrgSettings>;
  private holidayRepo: Repository<Holiday>;

  constructor() {
    this.settingsRepo = AppDataSource.getRepository(OrgSettings);
    this.holidayRepo = AppDataSource.getRepository(Holiday);
  }

  // ── Org Settings ──

  async getSettings(): Promise<OrgSettings | null> {
    return this.settingsRepo.findOne({ where: {}, order: { createdAt: 'ASC' } });
  }

  async upsertSettings(data: Partial<OrgSettings>): Promise<OrgSettings> {
    let settings = await this.getSettings();
    if (settings) {
      Object.assign(settings, data);
      return this.settingsRepo.save(settings);
    }
    const created = this.settingsRepo.create(data);
    return this.settingsRepo.save(created);
  }

  // ── Holidays ──

  async findAllHolidays(): Promise<Holiday[]> {
    return this.holidayRepo.find({ order: { date: 'ASC' } });
  }

  async findHolidayById(id: string): Promise<Holiday | null> {
    return this.holidayRepo.findOne({ where: { id } });
  }

  async findHolidayByDate(date: string): Promise<Holiday | null> {
    return this.holidayRepo.findOne({ where: { date } });
  }

  async createHoliday(data: Partial<Holiday>): Promise<Holiday> {
    const holiday = this.holidayRepo.create(data);
    return this.holidayRepo.save(holiday);
  }

  async updateHoliday(id: string, data: Partial<Holiday>): Promise<void> {
    await this.holidayRepo.update(id, data);
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.holidayRepo.delete(id);
  }
}
