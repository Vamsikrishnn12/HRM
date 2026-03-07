import { z } from 'zod';

export const startWorkSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const endWorkSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  eodDescription: z.string().max(1000).optional(),
});

export const overrideStatusSchema = z.object({
  status: z.enum([
    'PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE',
    'HOLIDAY', 'WEEK_OFF', 'NOT_STARTED', 'MISSED_CHECK_IN',
  ]),
  reason: z.string().min(1).max(500),
});

export const manualEntrySchema = z.object({
  firstCheckInAt: z.string().datetime().optional(),
  lastCheckOutAt: z.string().datetime().optional(),
  status: z.enum([
    'PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE',
  ]).optional(),
  reason: z.string().min(1).max(500).optional(),
});

export const reEnableStartWorkSchema = z.object({
  reason: z.string().max(500).optional(),
  validUntil: z.string().datetime().optional(),
});

export const adminOverrideByEmployeeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.enum([
    'PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE',
    'HOLIDAY', 'WEEK_OFF', 'NOT_STARTED', 'MISSED_CHECK_IN',
  ]),
  reason: z.string().min(1).max(500),
});

export const adminManualEntryByEmployeeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  firstCheckInAt: z.string().datetime().optional(),
  lastCheckOutAt: z.string().datetime().optional(),
  status: z.enum([
    'PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE',
  ]).optional(),
  reason: z.string().min(1).max(500).optional(),
});
