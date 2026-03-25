import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { AttendanceDayType } from '../attendance/attendance.enums';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
  NOT_STARTED = 'NOT_STARTED',
  MISSED_CHECK_IN = 'MISSED_CHECK_IN',
  PERMISSION = 'PERMISSION',
  REGULARIZED = 'REGULARIZED',
  LOP = 'LOP',
  MISSING_PUNCH = 'MISSING_PUNCH',
  EARLY_OUT = 'EARLY_OUT',
  OVERTIME = 'OVERTIME',
}

@Entity('attendance')
@Unique(['employeeId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  firstCheckInAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckOutAt: Date | null;

  @Column({ type: 'int', default: 0 })
  totalWorkMinutes: number;

  @Column({ type: 'int', default: 0 })
  totalBreakMinutes: number;

  @Column({ type: 'int', default: 0 })
  earlyOutMinutes: number;

  @Column({ type: 'int', default: 0 })
  overtimeMinutes: number;

  @Column({ type: 'int', default: 0 })
  punchSessionsCount: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status: AttendanceStatus;

  @Column({ type: 'int', default: 0 })
  lateMinutes: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: AttendanceDayType.WORKING,
  })
  dayType: AttendanceDayType | string;

  @Column({ type: 'boolean', default: false })
  missingPunch: boolean;

  @Column({ type: 'boolean', default: false })
  geoFenceIssue: boolean;

  @Column({ type: 'int', default: 0 })
  permissionMinutesApplied: number;

  @Column({ type: 'boolean', default: false })
  regularized: boolean;

  @Column({ type: 'uuid', nullable: true })
  appliedPolicyId: string | null;

  @Column({ type: 'int', default: 1 })
  policyVersion: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  statusReason: string | null;

  @Column({ type: 'jsonb', default: {} })
  derivedSummary: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isManualOverride: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  overrideReason: string | null;

  @Column({ type: 'text', nullable: true })
  eodDescription: string | null;

  @Column({ type: 'boolean', default: false })
  locationValidated: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLongitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLongitude: number | null;

  @Column({ type: 'boolean', default: false })
  startWorkOverrideEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  overrideValidUntil: Date | null;

  @Column({ type: 'uuid', nullable: true })
  overrideSetBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  overrideSetAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isAutoClosed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;
}
