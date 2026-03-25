import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SalaryStructureStatus } from '../salary/salary.enums';
import { OrganizationSalaryConfig } from './OrganizationSalaryConfig.entity';
import { User } from './User.entity';
import { EmployeeSalaryComponent } from './EmployeeSalaryComponent.entity';
import { EmployeeStatutoryBreakdown } from './EmployeeStatutoryBreakdown.entity';

@Entity('employee_salary_structures')
export class EmployeeSalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @Column({ type: 'uuid' })
  organizationSalaryConfigId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  annualCtc: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyCtc: number;

  @Column({ type: 'varchar', length: 10, default: 'New' })
  taxRegime: string;

  @Column({ type: 'boolean', default: false })
  overrideEnabled: boolean;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({
    type: 'enum',
    enum: SalaryStructureStatus,
    default: SalaryStructureStatus.ACTIVE,
  })
  status: SalaryStructureStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', default: {} })
  summary: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  bankingInfo: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @ManyToOne(() => OrganizationSalaryConfig, (config) => config.employeeStructures, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organizationSalaryConfigId' })
  organizationSalaryConfig: OrganizationSalaryConfig;

  @OneToMany(() => EmployeeSalaryComponent, (component) => component.employeeSalaryStructure, {
    cascade: true,
  })
  components: EmployeeSalaryComponent[];

  @OneToMany(
    () => EmployeeStatutoryBreakdown,
    (statutory) => statutory.employeeSalaryStructure,
    { cascade: true },
  )
  statutoryBreakdowns: EmployeeStatutoryBreakdown[];
}
