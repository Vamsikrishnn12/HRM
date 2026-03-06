import { z } from 'zod';

export const applyLeaveSchema = z
  .object({
    leaveType: z.enum(['CL', 'SL', 'EL', 'LOP', 'PERMISSION']),
    requestMode: z.enum(['FULL_DAY', 'HALF_DAY', 'PERMISSION']),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
      .optional(),
    halfDaySession: z.enum(['FN', 'AN']).optional(),
    fromTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm')
      .optional(),
    toTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm')
      .optional(),
    reason: z.string().min(1, 'Reason is required').max(1000),
  })
  .refine(
    (data) => {
      if (data.requestMode === 'FULL_DAY') {
        return !!data.startDate && !!data.endDate;
      }
      return true;
    },
    { message: 'startDate and endDate are required for full-day leave', path: ['startDate'] },
  )
  .refine(
    (data) => {
      if (data.requestMode === 'HALF_DAY') {
        return !!data.date && !!data.halfDaySession;
      }
      return true;
    },
    { message: 'date and halfDaySession are required for half-day leave', path: ['date'] },
  )
  .refine(
    (data) => {
      if (data.requestMode === 'PERMISSION') {
        return !!data.date && !!data.fromTime && !!data.toTime;
      }
      return true;
    },
    { message: 'date, fromTime and toTime are required for permission', path: ['date'] },
  );

export const adminActionSchema = z.object({
  remarks: z.string().max(1000).optional(),
});

export const adminOverrideSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  remarks: z.string().max(1000).optional(),
  leaveType: z.enum(['CL', 'SL', 'EL', 'LOP', 'PERMISSION']).optional(),
});

export const updatePolicySchema = z.object({
  probationPeriodMonths: z.number().int().min(0).max(24).optional(),
  probationLeaveAllowed: z.boolean().optional(),
  allowHalfDayLeave: z.boolean().optional(),
  allowPermissionHours: z.boolean().optional(),
  maxPermissionHoursPerMonth: z.number().min(0).max(100).optional(),
  slabs: z
    .array(
      z.object({
        minYearsOfService: z.number().int().min(0),
        maxYearsOfService: z.number().int().min(0).nullable(),
        casualLeavePerYear: z.number().int().min(0).max(365),
        sickLeavePerYear: z.number().int().min(0).max(365),
        earnedLeavePerYear: z.number().int().min(0).max(365),
      }),
    )
    .optional(),
});
