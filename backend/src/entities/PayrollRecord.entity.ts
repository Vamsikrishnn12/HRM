import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { PayrollRun } from './PayrollRun.entity';
import { PayslipDocument } from './PayslipDocument.entity';

export enum PayrollRecordStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EMAILED = 'EMAILED',
  FAILED = 'FAILED',
}

export enum PayrollSource {
  MANUAL = 'MANUAL',
  BULK_UPLOAD = 'BULK_UPLOAD',
  SYSTEM_AUTO = 'SYSTEM_AUTO',
}

export interface PayrollComponent {
  name: string;
  amount: number;
}

@Entity('payroll_records')
export class PayrollRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  payrollRunId: string | null;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'jsonb', default: {} })
  employeeSnapshot: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  attendanceSnapshot: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  earnings: PayrollComponent[];

  @Column({ type: 'jsonb', default: [] })
  deductions: PayrollComponent[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grossEarnings: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netPay: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  payableDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  workingDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  eligibleWorkingDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  presentDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  leaveDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  lopDays: number;

  @Column({
    type: 'enum',
    enum: PayrollRecordStatus,
    default: PayrollRecordStatus.DRAFT,
  })
  status: PayrollRecordStatus;

  @Column({ type: 'enum', enum: PayrollSource, default: PayrollSource.MANUAL })
  source: PayrollSource;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PayrollRun, (r) => r.records, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun: PayrollRun | null;

  @OneToOne(() => PayslipDocument, (d) => d.payrollRecord)
  payslipDocument: PayslipDocument | null;
}
