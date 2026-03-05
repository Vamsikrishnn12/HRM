import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { EmployeeProfile } from '../entities/EmployeeProfile.entity';

export class EmployeeRepository {
  private repo: Repository<EmployeeProfile>;

  constructor() {
    this.repo = AppDataSource.getRepository(EmployeeProfile);
  }

  async create(data: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    const profile = this.repo.create(data);
    return this.repo.save(profile);
  }

  async findAll(): Promise<EmployeeProfile[]> {
    return this.repo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<EmployeeProfile | null> {
    return this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findById(id: string): Promise<EmployeeProfile | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async update(id: string, data: Partial<EmployeeProfile>): Promise<void> {
    await this.repo.update(id, data);
  }
}
