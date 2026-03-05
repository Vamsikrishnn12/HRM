import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PersonalDetails } from '../entities/PersonalDetails.entity';

export class PersonalDetailsRepository {
  private repo: Repository<PersonalDetails>;

  constructor() {
    this.repo = AppDataSource.getRepository(PersonalDetails);
  }

  async create(data: Partial<PersonalDetails>): Promise<PersonalDetails> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async findAll(): Promise<PersonalDetails[]> {
    return this.repo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<PersonalDetails | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<PersonalDetails | null> {
    return this.repo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, data: Partial<PersonalDetails>): Promise<void> {
    await this.repo.update(id, data);
  }

  async upsertByUserId(userId: string, data: Partial<PersonalDetails>): Promise<PersonalDetails> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await this.repo.update(existing.id, data);
      return this.findById(existing.id) as Promise<PersonalDetails>;
    }
    return this.create({ ...data, userId });
  }
}
