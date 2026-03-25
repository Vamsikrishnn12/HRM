import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('attendance_audit_logs')
export class AttendanceAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 80 })
  actionType: string;

  @Column({ type: 'varchar', length: 80 })
  targetType: string;

  @Column({ type: 'uuid', nullable: true })
  targetId: string | null;

  @Column({ type: 'jsonb', default: {} })
  beforeData: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  afterData: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
