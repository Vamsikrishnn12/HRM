import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attendance } from './Attendance.entity';
import { User } from './User.entity';

@Entity('attendance_sessions')
export class AttendanceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  attendanceId: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp' })
  inTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  outTime: Date | null;

  @Column({ type: 'int', default: 0 })
  workedMinutes: number;

  @Column({ type: 'int', default: 0 })
  breakAfterMinutes: number;

  @Column({ type: 'int', default: 1 })
  sessionOrder: number;

  @Column({ type: 'boolean', default: false })
  isAutoClosed: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendanceId' })
  attendance: Attendance;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;
}
