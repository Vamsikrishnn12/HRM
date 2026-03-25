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
  SalaryCalculationType,
  SalaryComponentCategory,
  SalaryComponentSourceType,
} from '../salary/salary.enums';
import { EmployeeSalaryStructure } from './EmployeeSalaryStructure.entity';

@Entity('employee_salary_components')
export class EmployeeSalaryComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeSalaryStructureId: string;

  @Column({ type: 'varchar', length: 120 })
  componentName: string;

  @Column({ type: 'varchar', length: 80 })
  componentCode: string;

  @Column({
    type: 'enum',
    enum: SalaryComponentCategory,
  })
  category: SalaryComponentCategory;

  @Column({
    type: 'enum',
    enum: SalaryComponentSourceType,
    default: SalaryComponentSourceType.TEMPLATE_DEFAULT,
  })
  sourceType: SalaryComponentSourceType;

  @Column({
    type: 'enum',
    enum: SalaryCalculationType,
    default: SalaryCalculationType.FIXED,
  })
  calculationType: SalaryCalculationType;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  value: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  calculatedAmount: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  percentageOf: string | null;

  @Column({ type: 'text', nullable: true })
  formulaReference: string | null;

  @Column({ type: 'boolean', default: false })
  isOverride: boolean;

  @Column({ type: 'boolean', default: true })
  includeInGross: boolean;

  @Column({ type: 'boolean', default: true })
  taxable: boolean;

  @Column({ type: 'boolean', default: false })
  includeInPfWage: boolean;

  @Column({ type: 'boolean', default: false })
  includeInEsiWage: boolean;

  @Column({ type: 'boolean', default: true })
  affectsNetPay: boolean;

  @Column({ type: 'int', default: 1 })
  displayOrder: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => EmployeeSalaryStructure,
    (employeeSalaryStructure) => employeeSalaryStructure.components,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'employeeSalaryStructureId' })
  employeeSalaryStructure: EmployeeSalaryStructure;
}
