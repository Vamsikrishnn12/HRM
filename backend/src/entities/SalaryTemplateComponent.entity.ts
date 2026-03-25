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
  SalaryComponentStatus,
} from '../salary/salary.enums';
import { OrganizationSalaryConfig } from './OrganizationSalaryConfig.entity';

@Entity('salary_template_components')
export class SalaryTemplateComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationSalaryConfigId: string;

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
    enum: SalaryComponentStatus,
    default: SalaryComponentStatus.ACTIVE,
  })
  status: SalaryComponentStatus;

  @Column({ type: 'boolean', default: true })
  defaultEnabled: boolean;

  @Column({
    type: 'enum',
    enum: SalaryCalculationType,
    default: SalaryCalculationType.FIXED,
  })
  calculationType: SalaryCalculationType;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  value: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  percentageOf: string | null;

  @Column({ type: 'text', nullable: true })
  formulaExpression: string | null;

  @Column({ type: 'boolean', default: true })
  taxable: boolean;

  @Column({ type: 'boolean', default: false })
  includeInPfWage: boolean;

  @Column({ type: 'boolean', default: false })
  includeInEsiWage: boolean;

  @Column({ type: 'boolean', default: true })
  includeInGross: boolean;

  @Column({ type: 'boolean', default: true })
  affectsNetPay: boolean;

  @Column({ type: 'boolean', default: true })
  editableForEmployee: boolean;

  @Column({ type: 'int', default: 1 })
  displayOrder: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => OrganizationSalaryConfig,
    (organizationSalaryConfig) => organizationSalaryConfig.templateComponents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationSalaryConfigId' })
  organizationSalaryConfig: OrganizationSalaryConfig;
}
