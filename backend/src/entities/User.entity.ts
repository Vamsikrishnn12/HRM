import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RefreshToken } from './RefreshToken.entity';
import type { EmployeeProfile } from './EmployeeProfile.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  empId: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  officeLocationRequired: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLongitude: number | null;

  @Column({ type: 'int', nullable: true })
  officeRadiusMeters: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship: Refresh Tokens
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  // Relationship: Employee Profile
  @OneToOne('EmployeeProfile', 'user')
  employeeProfile: EmployeeProfile;
}
