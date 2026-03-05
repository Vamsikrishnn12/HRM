import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [
    User,
    RefreshToken,
  
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
