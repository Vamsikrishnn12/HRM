import { z } from 'zod';

export const saveSalarySchema = z.object({
  ctc: z.number().min(0).optional().default(0),
  basic: z.number().min(0).optional().default(0),
  hra: z.number().min(0).optional().default(0),
  allowances: z.number().min(0).optional().default(0),
  pfApplicable: z.boolean().optional().default(true),
  pfEmployeeContribution: z.number().min(0).optional().default(0),
  pfEmployerContribution: z.number().min(0).optional().default(0),
  taxRegime: z.string().max(10).optional().default('New'),
  accountNumber: z.string().max(30).optional().default(''),
  ifscCode: z.string().max(20).optional().default(''),
  bankName: z.string().max(100).optional().default(''),
  branchName: z.string().max(100).optional().default(''),
  panNumber: z.string().max(10).optional().default(''),
  uanNumber: z.string().max(20).optional().default(''),
});
