import { z } from 'zod';

const previewInputSchema = z
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

const customComponentSchema = z.object({
  componentName: z.string().min(1).max(120),
  componentCode: z.string().max(80).optional(),
  category: z.enum(['EARNING', 'DEDUCTION']),
  amount: z.number().min(0),
  includeInGross: z.boolean().optional(),
  taxable: z.boolean().optional(),
  includeInPfWage: z.boolean().optional(),
  includeInEsiWage: z.boolean().optional(),
  affectsNetPay: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const bankingInfoSchema = z.object({
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(30).optional(),
  ifscCode: z.string().max(20).optional(),
  branchName: z.string().max(100).optional(),
  panNumber: z.string().max(10).optional(),
  uanNumber: z.string().max(20).optional(),
});

export const previewEmployeeSalaryStructureSchema = previewInputSchema.extend({
  customComponents: z.array(customComponentSchema).optional(),
});

export const saveEmployeeSalaryStructureSchema = previewInputSchema.extend({
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional(),
  overrideEnabled: z.boolean().optional(),
  customComponents: z.array(customComponentSchema).optional(),
  bankingInfo: bankingInfoSchema.optional(),
});
