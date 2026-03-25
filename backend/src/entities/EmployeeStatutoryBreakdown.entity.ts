import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  StatutoryCalculationMode,
  StatutoryComponentSide,
  StatutoryType,
} from '../salary/salary.enums';
import { EmployeeSalaryStructure } from './EmployeeSalaryStructure.entity';

@Entity('employee_statutory_breakdowns')
export class EmployeeStatutoryBreakdown {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeSalaryStructureId: string;

  @Column({
    type: 'enum',
    enum: StatutoryType,
    default: StatutoryType.OTHER,
  })
  statutoryType: StatutoryType;

  @Column({
    type: 'enum',
    enum: StatutoryComponentSide,
    default: StatutoryComponentSide.EMPLOYEE,
  })
  componentSide: StatutoryComponentSide;

  @Column({ type: 'varchar', length: 120 })
  componentName: string;

  @Column({
    type: 'enum',
    enum: StatutoryCalculationMode,
    default: StatutoryCalculationMode.PERCENTAGE,
  })
  calculationMode: StatutoryCalculationMode;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  rate: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basisAmount: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  wageBasis: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => EmployeeSalaryStructure,
    (employeeSalaryStructure) => employeeSalaryStructure.statutoryBreakdowns,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'employeeSalaryStructureId' })
  employeeSalaryStructure: EmployeeSalaryStructure;
}
