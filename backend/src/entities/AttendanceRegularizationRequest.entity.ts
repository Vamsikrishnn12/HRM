import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AttendanceRegularizationRequestType,
  AttendanceRequestStatus,
} from '../attendance/attendance.enums';

@Entity('attendance_regularization_requests')
export class AttendanceRegularizationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: AttendanceRegularizationRequestType,
    default: AttendanceRegularizationRequestType.OTHER,
  })
  requestType: AttendanceRegularizationRequestType;

  @Column({ type: 'timestamp', nullable: true })
  requestedInTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  requestedOutTime: Date | null;

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

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
