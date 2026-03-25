import { z } from 'zod';

const componentSchema = z.object({
  componentName: z.string().min(1).max(120),
  componentCode: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Invalid component code'),
  category: z.enum(['EARNING', 'DEDUCTION']),
  sourceType: z.enum([
    'TEMPLATE_DEFAULT',
    'AUTO_STATUTORY',
    'MANUAL_DEFAULT',
    'EMPLOYEE_CUSTOM',
  ]),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  defaultEnabled: z.boolean(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA', 'RESIDUAL']),
  value: z.number().nullable().optional(),
  percentageOf: z.string().nullable().optional(),
  formulaExpression: z.string().nullable().optional(),
  taxable: z.boolean(),
  includeInPfWage: z.boolean(),
  includeInEsiWage: z.boolean(),
  includeInGross: z.boolean(),
  affectsNetPay: z.boolean(),
  editableForEmployee: z.boolean(),
  displayOrder: z.number().int().min(0),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const pfConfigSchema = z.object({
  pfApplicable: z.boolean(),
  pfCalculationMode: z.enum(['PERCENTAGE', 'FIXED', 'SLAB']),
  pfWageBasis: z.enum(['BASIC', 'BASIC_DA', 'PF_ELIGIBLE_EARNINGS', 'CUSTOM']),
  pfCustomComponentCodes: z.array(z.string()).optional(),
  employeePfRate: z.number().min(0),
  employerPfRate: z.number().min(0),
  pensionRate: z.number().min(0),
  employeePfFixedAmount: z.number().min(0).optional(),
  employerPfFixedAmount: z.number().min(0).optional(),
  pensionFixedAmount: z.number().min(0).optional(),
  pfWageLimitEnabled: z.boolean(),
  pfWageLimitAmount: z.number().min(0),
  allowHigherPf: z.boolean(),
  roundOffRule: z.enum(['NONE', 'ROUND', 'FLOOR', 'CEIL']),
  editablePerEmployee: z.boolean(),
  defaultEnabled: z.boolean(),
});

const esiConfigSchema = z.object({
  esiApplicable: z.boolean(),
  esiCalculationMode: z.enum(['PERCENTAGE', 'FIXED', 'SLAB']),
  employeeEsiRate: z.number().min(0),
  employerEsiRate: z.number().min(0),
  employeeEsiFixedAmount: z.number().min(0).optional(),
  employerEsiFixedAmount: z.number().min(0).optional(),
  esiWageBasis: z.enum(['GROSS', 'ESI_ELIGIBLE_EARNINGS', 'CUSTOM']),
  esiCustomComponentCodes: z.array(z.string()).optional(),
  esiEligibilityThresholdEnabled: z.boolean(),
  esiEligibilityThresholdAmount: z.number().min(0),
  roundOffRule: z.enum(['NONE', 'ROUND', 'FLOOR', 'CEIL']),
  editablePerEmployee: z.boolean(),
  defaultEnabled: z.boolean(),
});

const ptSlabSchema = z.object({
  minAmount: z.number().min(0),
  maxAmount: z.number().nullable(),
  amount: z.number().min(0),
});

const ptConfigSchema = z.object({
  ptApplicable: z.boolean(),
  ptCalculationMode: z.enum(['FIXED', 'SLAB']),
  fixedAmount: z.number().min(0),
  slabs: z.array(ptSlabSchema),
  editablePerEmployee: z.boolean(),
  defaultEnabled: z.boolean(),
});

const roundingRulesSchema = z.object({
  componentRule: z.enum(['NONE', 'ROUND', 'FLOOR', 'CEIL']),
  statutoryRule: z.enum(['NONE', 'ROUND', 'FLOOR', 'CEIL']),
  summaryRule: z.enum(['NONE', 'ROUND', 'FLOOR', 'CEIL']),
});

const salaryPreviewInputSchema = z
  .object({
    annualCtc: z.number().min(0).optional(),
    monthlyCtc: z.number().min(0).optional(),
    taxRegime: z.string().max(10).optional(),
    componentOverrides: z.record(z.string(), z.number()).optional(),
    componentStates: z.record(z.string(), z.boolean()).optional(),
    statutoryOverrides: z
      .object({
        pfApplicable: z.boolean().optional(),
        esiApplicable: z.boolean().optional(),
        ptApplicable: z.boolean().optional(),
        employeePfRate: z.number().min(0).optional(),
        employerPfRate: z.number().min(0).optional(),
        employeeEsiRate: z.number().min(0).optional(),
        employerEsiRate: z.number().min(0).optional(),
        ptFixedAmount: z.number().min(0).optional(),
      })
      .optional(),
  })
  .refine((val) => (val.annualCtc ?? 0) > 0 || (val.monthlyCtc ?? 0) > 0, {
    message: 'Either annualCtc or monthlyCtc is required.',
    path: ['monthlyCtc'],
  });

export const saveSalaryConfigSchema = z.object({
  defaultTemplateName: z.string().min(1).max(160),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxRegimeDefaults: z.string().max(10).default('New'),
  pfConfig: pfConfigSchema,
  esiConfig: esiConfigSchema,
  ptConfig: ptConfigSchema,
  roundingRules: roundingRulesSchema,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  components: z.array(componentSchema).min(1),
});

export const previewSalaryConfigSchema = z.object({
  configInput: saveSalaryConfigSchema.optional(),
  previewInput: salaryPreviewInputSchema,
});
