export const DEFAULT_ORGANIZATION_ID = 'ORG_DEFAULT';

export enum SalaryComponentCategory {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

export enum SalaryComponentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SalaryComponentSourceType {
  TEMPLATE_DEFAULT = 'TEMPLATE_DEFAULT',
  AUTO_STATUTORY = 'AUTO_STATUTORY',
  MANUAL_DEFAULT = 'MANUAL_DEFAULT',
  EMPLOYEE_CUSTOM = 'EMPLOYEE_CUSTOM',
}

export enum SalaryCalculationType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  FORMULA = 'FORMULA',
  RESIDUAL = 'RESIDUAL',
}

export enum StatutoryType {
  PF = 'PF',
  ESI = 'ESI',
  PT = 'PT',
  OTHER = 'OTHER',
}

export enum StatutoryComponentSide {
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYER = 'EMPLOYER',
  SHARED = 'SHARED',
}

export enum StatutoryCalculationMode {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  SLAB = 'SLAB',
}

export enum SalaryStructureStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum RoundingRule {
  NONE = 'NONE',
  ROUND = 'ROUND',
  FLOOR = 'FLOOR',
  CEIL = 'CEIL',
}

export enum PercentageBasis {
  CTC = 'CTC',
  MONTHLY_CTC = 'MONTHLY_CTC',
  BASIC = 'BASIC',
  BASIC_PLUS_HRA = 'BASIC_PLUS_HRA',
  GROSS = 'GROSS',
}

export enum PfWageBasis {
  BASIC = 'BASIC',
  BASIC_DA = 'BASIC_DA',
  PF_ELIGIBLE_EARNINGS = 'PF_ELIGIBLE_EARNINGS',
  CUSTOM = 'CUSTOM',
}

export enum EsiWageBasis {
  GROSS = 'GROSS',
  ESI_ELIGIBLE_EARNINGS = 'ESI_ELIGIBLE_EARNINGS',
  CUSTOM = 'CUSTOM',
}

export enum PtCalculationMode {
  FIXED = 'FIXED',
  SLAB = 'SLAB',
}
