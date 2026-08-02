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

  async findByEmpId(empId: string): Promise<User | null> {
    return this.repo.findOne({ where: { empId } });
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

  async update(id: string, data: Partial<User>): Promise<void> {
    await this.repo.update(id, data);
  }

  async archiveEmployee(id: string): Promise<void> {
    // Keep the internal user row so attendance/payroll history remains linked,
    // while releasing all identifiers that must be unique for future hires.
    await this.repo.update(id, {
      email: `deleted-${id}@deleted.invalid`,
      empId: null,
      password: `deleted-${id}`,
      isActive: false,
      profilePhotoUrl: null,
      officeLocationRequired: false,
      officeLatitude: null,
      officeLongitude: null,
      officeRadiusMeters: null,
      deletedAt: new Date(),
    });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

}
