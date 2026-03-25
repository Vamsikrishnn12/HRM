import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { LeavePolicySlab } from './LeavePolicySlab.entity';

@Entity('leave_policies')
export class LeavePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Probation Rules ──
  @Column({ type: 'int', default: 6 })
  probationPeriodMonths: number;

  @Column({ type: 'boolean', default: false })
  probationLeaveAllowed: boolean;

  // ── General Rules ──
  @Column({ type: 'boolean', default: true })
  allowHalfDayLeave: boolean;

  @Column({ type: 'boolean', default: true })
  allowPermissionHours: boolean;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 2 })
  maxPermissionHoursPerMonth: number;

  @Column({ type: 'int', default: 4 })
  maxPermissionRequestsPerMonth: number;

  @Column({ type: 'int', default: 4 })
  maxRegularizationsPerMonth: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('LeavePolicySlab', 'leavePolicy')
  slabs: LeavePolicySlab[];
}
