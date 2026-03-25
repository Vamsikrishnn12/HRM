import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User.entity';
import { AttendanceAccessMode } from '../attendance/attendance.enums';

@Entity('attendance_employee_policy_overrides')
@Unique(['employeeId'])
export class AttendanceEmployeePolicyOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'varchar', length: 30, default: AttendanceAccessMode.ORG_DEFAULT })
  overrideMode: AttendanceAccessMode | string;

  @Column({ type: 'boolean', default: false })
  geoFenceExempt: boolean;

  @Column({ type: 'boolean', nullable: true })
  remotePunchAllowed: boolean | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'date', nullable: true })
  effectiveFrom: string | null;

  @Column({ type: 'date', nullable: true })
  effectiveUntil: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;
}

