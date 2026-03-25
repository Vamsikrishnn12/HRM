import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DEFAULT_ORGANIZATION_ID } from '../salary/salary.enums';
import {
  EsiConfig,
  PfConfig,
  PtConfig,
  SalaryRoundingRules,
} from '../salary/salary.types';
import { SalaryTemplateComponent } from './SalaryTemplateComponent.entity';
import { EmployeeSalaryStructure } from './EmployeeSalaryStructure.entity';

@Entity('organization_salary_configs')
export class OrganizationSalaryConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, default: DEFAULT_ORGANIZATION_ID })
  organizationId: string;

  @Column({ type: 'varchar', length: 160, default: 'Default Salary Template' })
  defaultTemplateName: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'varchar', length: 10, default: 'New' })
  taxRegimeDefaults: string;

  @Column({ type: 'jsonb', default: {} })
  pfConfig: PfConfig;

  @Column({ type: 'jsonb', default: {} })
  esiConfig: EsiConfig;

  @Column({ type: 'jsonb', default: {} })
  ptConfig: PtConfig;

  @Column({ type: 'jsonb', default: {} })
  roundingRules: SalaryRoundingRules;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SalaryTemplateComponent, (component) => component.organizationSalaryConfig, {
    cascade: true,
  })
  templateComponents: SalaryTemplateComponent[];

  @OneToMany(() => EmployeeSalaryStructure, (structure) => structure.organizationSalaryConfig)
  employeeStructures: EmployeeSalaryStructure[];
}
