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
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEK_OFF']),
  reason: z.string().min(1).max(500),
});

export const manualEntrySchema = z.object({
  firstCheckInAt: z.string().datetime().optional(),
  lastCheckOutAt: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LEAVE']).optional(),
  reason: z.string().min(1).max(500).optional(),
});
