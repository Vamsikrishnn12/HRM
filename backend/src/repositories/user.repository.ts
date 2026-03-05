import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repo.create(userData);
    return this.repo.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repo.update(userId, { lastLoginAt: new Date() });
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async generateNextEmpId(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('user')
      .select("MAX(CAST(SUBSTRING(user.empId FROM 4) AS INTEGER))", 'maxNum')
      .where("user.empId IS NOT NULL")
      .getRawOne();
    const next = (result?.maxNum || 0) + 1;
    return `EMP${String(next).padStart(3, '0')}`;
  }
}
