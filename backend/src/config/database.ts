import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { EmployeeProfile } from '../entities/EmployeeProfile.entity';
import { PersonalDetails } from '../entities/PersonalDetails.entity';
import { SalaryDetails } from '../entities/SalaryDetails.entity';
import { EmployeeDocument } from '../entities/EmployeeDocument.entity';
import { OrgSettings } from '../entities/OrgSettings.entity';
import { Holiday } from '../entities/Holiday.entity';
import { Attendance } from '../entities/Attendance.entity';
import { AttendancePunch } from '../entities/AttendancePunch.entity';

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
    EmployeeProfile,
    PersonalDetails,
    SalaryDetails,
    EmployeeDocument,
    OrgSettings,
    Holiday,
    Attendance,
    AttendancePunch,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
