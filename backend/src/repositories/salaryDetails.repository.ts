import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SalaryDetails } from '../entities/SalaryDetails.entity';

export class SalaryDetailsRepository {
  private repo: Repository<SalaryDetails>;

  constructor() {
    this.repo = AppDataSource.getRepository(SalaryDetails);
  }

  async create(data: Partial<SalaryDetails>): Promise<SalaryDetails> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async findAll(): Promise<SalaryDetails[]> {
    return this.repo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<SalaryDetails | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<SalaryDetails | null> {
    return this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, data: Partial<SalaryDetails>): Promise<void> {
    await this.repo.update(id, data);
  }

  async upsertByUserId(userId: string, data: Partial<SalaryDetails>): Promise<SalaryDetails> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await this.repo.update(existing.id, data);
      return this.findById(existing.id) as Promise<SalaryDetails>;
    }
    return this.create({ ...data, userId });
  }
}
