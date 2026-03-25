import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LeaveType {
  CL = 'CL',
  SL = 'SL',
  EL = 'EL',
  LOP = 'LOP',
  PERMISSION = 'PERMISSION',
}

export enum RequestMode {
  FULL_DAY = 'FULL_DAY',
  HALF_DAY = 'HALF_DAY',
  PERMISSION = 'PERMISSION',
}

export enum HalfDaySession {
  FN = 'FN',
  AN = 'AN',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  // Admin-reviewed treatment (can differ from requested leave type)
  @Column({ type: 'enum', enum: LeaveType, nullable: true })
  approvedLeaveType: LeaveType | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  finalAttendanceCode: string | null;

  // Suggested treatment snapshot at apply-time (for probation/policy contexts)
  @Column({ type: 'enum', enum: LeaveType, nullable: true })
  suggestedLeaveType: LeaveType | null;

  @Column({ type: 'text', nullable: true })
  treatmentNote: string | null;

  @Column({ type: 'enum', enum: RequestMode })
  requestMode: RequestMode;

  // Full-day leave
  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  // Half-day / permission
  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ type: 'enum', enum: HalfDaySession, nullable: true })
  halfDaySession: HalfDaySession | null;

  // Permission times
  @Column({ type: 'time', nullable: true })
  fromTime: string | null;

  @Column({ type: 'time', nullable: true })
  toTime: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  totalDays: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  totalHours: number | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string | null;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Column({ type: 'jsonb', nullable: true })
  policySnapshot: Record<string, unknown> | null;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
