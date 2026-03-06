import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeavePolicy } from './LeavePolicy.entity';

@Entity('leave_policy_slabs')
export class LeavePolicySlab {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leavePolicyId: string;

  @Column({ type: 'int' })
  minYearsOfService: number;

  @Column({ type: 'int', nullable: true })
  maxYearsOfService: number | null;

  @Column({ type: 'int', default: 6 })
  casualLeavePerYear: number;

  @Column({ type: 'int', default: 6 })
  sickLeavePerYear: number;

  @Column({ type: 'int', default: 0 })
  earnedLeavePerYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => LeavePolicy, (lp) => lp.slabs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leavePolicyId' })
  leavePolicy: LeavePolicy;
}
