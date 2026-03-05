import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { RefreshToken } from '../entities/RefreshToken.entity';

export class TokenRepository {
  private repo: Repository<RefreshToken>;

  constructor() {
    this.repo = AppDataSource.getRepository(RefreshToken);
  }

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      where: { token, isRevoked: false },
      relations: ['user'],
    });
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.repo.findOne({
      where: { id, isRevoked: false },
      relations: ['user'],
    });
  }

  async revokeToken(id: string): Promise<void> {
    await this.repo.update(id, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
