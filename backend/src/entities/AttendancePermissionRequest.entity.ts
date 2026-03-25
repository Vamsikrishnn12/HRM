import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttendanceRequestStatus } from '../attendance/attendance.enums';

@Entity('attendance_permission_requests')
export class AttendancePermissionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  fromTime: string;

  @Column({ type: 'time' })
  toTime: string;

  @Column({ type: 'int', default: 0 })
  totalMinutes: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: AttendanceRequestStatus,
    default: AttendanceRequestStatus.PENDING,
  })
  status: AttendanceRequestStatus;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  appliedMinutes: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
