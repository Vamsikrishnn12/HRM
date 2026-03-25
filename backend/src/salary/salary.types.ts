import {
  EsiWageBasis,
  PercentageBasis,
  PfWageBasis,
  PtCalculationMode,
  RoundingRule,
  SalaryCalculationType,
  SalaryComponentCategory,
  SalaryComponentSourceType,
  SalaryComponentStatus,
  StatutoryCalculationMode,
} from './salary.enums';

export interface SalaryRoundingRules {
  componentRule: RoundingRule;
  statutoryRule: RoundingRule;
  summaryRule: RoundingRule;
}

export interface PfConfig {
  pfApplicable: boolean;
  pfCalculationMode: StatutoryCalculationMode;
  pfWageBasis: PfWageBasis;
  pfCustomComponentCodes?: string[];
  employeePfRate: number;
  employerPfRate: number;
  pensionRate: number;
  employeePfFixedAmount?: number;
  employerPfFixedAmount?: number;
  pensionFixedAmount?: number;
  pfWageLimitEnabled: boolean;
  pfWageLimitAmount: number;
  allowHigherPf: boolean;
  roundOffRule: RoundingRule;
  editablePerEmployee: boolean;
  defaultEnabled: boolean;
}

export interface EsiConfig {
  esiApplicable: boolean;
  esiCalculationMode: StatutoryCalculationMode;
  employeeEsiRate: number;
  employerEsiRate: number;
  employeeEsiFixedAmount?: number;
  employerEsiFixedAmount?: number;
  esiWageBasis: EsiWageBasis;
  esiCustomComponentCodes?: string[];
  esiEligibilityThresholdEnabled: boolean;
  esiEligibilityThresholdAmount: number;
  roundOffRule: RoundingRule;
  editablePerEmployee: boolean;
  defaultEnabled: boolean;
}

export interface ProfessionalTaxSlab {
  minAmount: number;
  maxAmount: number | null;
  amount: number;
}

export interface PtConfig {
  ptApplicable: boolean;
  ptCalculationMode: PtCalculationMode;
  fixedAmount: number;
  slabs: ProfessionalTaxSlab[];
  editablePerEmployee: boolean;
  defaultEnabled: boolean;
}

export interface SalaryTemplateComponentInput {
  componentName: string;
  componentCode: string;
  category: SalaryComponentCategory;
  sourceType: SalaryComponentSourceType;
  status: SalaryComponentStatus;
  defaultEnabled: boolean;
  calculationType: SalaryCalculationType;
  value?: number | null;
  percentageOf?: PercentageBasis | string | null;
  formulaExpression?: string | null;
  taxable: boolean;
  includeInPfWage: boolean;
  includeInEsiWage: boolean;
  includeInGross: boolean;
  affectsNetPay: boolean;
  editableForEmployee: boolean;
  displayOrder: number;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationSalaryConfigInput {
  defaultTemplateName: string;
  effectiveFrom: string;
  taxRegimeDefaults: string;
  pfConfig: PfConfig;
  esiConfig: EsiConfig;
  ptConfig: PtConfig;
  roundingRules: SalaryRoundingRules;
  metadata?: Record<string, unknown> | null;
  components: SalaryTemplateComponentInput[];
}

export interface SalaryPreviewInput {
  annualCtc?: number;
  monthlyCtc?: number;
  taxRegime?: string;
  componentOverrides?: Record<string, number>;
  componentStates?: Record<string, boolean>;
  statutoryOverrides?: {
    pfApplicable?: boolean;
    esiApplicable?: boolean;
    ptApplicable?: boolean;
    employeePfRate?: number;
    employerPfRate?: number;
    employeeEsiRate?: number;
    employerEsiRate?: number;
    ptFixedAmount?: number;
  };
}
