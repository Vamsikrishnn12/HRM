import { z } from 'zod';

export const updateSettingsSchema = z.object({
  workStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
    .optional(),
  workEndTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
    .optional(),
  lateGraceMinutes: z.number().int().min(0).max(120).optional(),
  halfDayMinMinutes: z.number().int().min(1).max(600).optional(),
  fullDayMinMinutes: z.number().int().min(1).max(1440).optional(),
  weekOffDays: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  alternateSaturdayOffRule: z
    .enum(['NONE', 'SECOND_FOURTH', 'FIRST_THIRD'])
    .optional(),
  officeLatitude: z.number().min(-90).max(90).nullable().optional(),
  officeLongitude: z.number().min(-180).max(180).nullable().optional(),
  officeRadiusMeters: z.number().int().positive().nullable().optional(),
});

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required').max(255),
});

export const updateHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required').max(255),
});
