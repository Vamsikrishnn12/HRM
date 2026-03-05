import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('salary_details')
export class SalaryDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  // Salary Structure
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ctc: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basic: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  hra: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'boolean', default: true })
  pfApplicable: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pfEmployeeContribution: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pfEmployerContribution: number;

  @Column({ type: 'varchar', length: 10, default: 'New' })
  taxRegime: string;

  // Banking Information
  @Column({ type: 'varchar', length: 30, nullable: true })
  accountNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ifscCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branchName: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  uanNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
