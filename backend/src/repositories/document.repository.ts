import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { EmployeeDocument } from '../entities/EmployeeDocument.entity';

export class DocumentRepository {
  private repo: Repository<EmployeeDocument>;

  constructor() {
    this.repo = AppDataSource.getRepository(EmployeeDocument);
  }

  async create(data: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async findAll(): Promise<EmployeeDocument[]> {
    return this.repo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<EmployeeDocument | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<EmployeeDocument[]> {
    return this.repo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
