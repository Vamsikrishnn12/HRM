import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

export enum PunchType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export enum PunchSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  KIOSK = 'KIOSK',
  ADMIN = 'ADMIN',
}

@Entity('attendance_punches')
export class AttendancePunch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'enum', enum: PunchType })
  type: PunchType;

  @Column({ type: 'timestamp' })
  time: Date;

  @Column({ type: 'date', nullable: true })
  punchDate: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'boolean', default: false })
  isInsideOffice: boolean;

  @Column({ type: 'enum', enum: PunchSource, default: PunchSource.WEB })
  source: PunchSource;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remarks: string | null;

  @Column({ type: 'boolean', default: false })
  isManualOverride: boolean;

  @Column({ type: 'int', default: 1 })
  sessionOrder: number;

  @Column({ type: 'boolean', default: false })
  policyViolation: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;
}
