import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PayrollRecord } from './PayrollRecord.entity';

export enum PayrollRunStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

export enum PayrollRunType {
  BULK_UPLOAD = 'BULK_UPLOAD',
  SYSTEM_BULK = 'SYSTEM_BULK',
}

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'enum', enum: PayrollRunStatus, default: PayrollRunStatus.DRAFT })
  status: PayrollRunStatus;

  @Column({ type: 'enum', enum: PayrollRunType, default: PayrollRunType.SYSTEM_BULK })
  runType: PayrollRunType;

  @Column({ type: 'int', default: 0 })
  totalEmployees: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({ type: 'int', default: 0 })
  skippedCount: number;

  @Column({ type: 'int', default: 0 })
  processedCount: number;

  @Column({ type: 'int', default: 0 })
  emailedCount: number;

  @Column({ type: 'int', default: 0 })
  portalPublishedCount: number;

  @Column({ type: 'jsonb', default: [] })
  errorSummary: Array<{ employeeId?: string; employeeCode?: string; message: string }>;

  @Column({ type: 'jsonb', default: {} })
  resultSummary: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PayrollRecord, (r) => r.payrollRun)
  records: PayrollRecord[];
}
