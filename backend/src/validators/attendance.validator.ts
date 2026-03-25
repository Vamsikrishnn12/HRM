import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const attendanceStatusSchema = z.enum([
  'PRESENT',
  'LATE',
  'ABSENT',
  'HALF_DAY',
  'LEAVE',
  'HOLIDAY',
  'WEEK_OFF',
  'NOT_STARTED',
  'MISSED_CHECK_IN',
  'PERMISSION',
  'REGULARIZED',
  'LOP',
  'MISSING_PUNCH',
  'EARLY_OUT',
  'OVERTIME',
]);

const geoSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const startWorkSchema = geoSchema.extend({
  source: z.enum(['WEB', 'MOBILE', 'KIOSK', 'ADMIN']).optional(),
});

export const endWorkSchema = geoSchema.extend({
  source: z.enum(['WEB', 'MOBILE', 'KIOSK', 'ADMIN']).optional(),
  eodDescription: z.string().max(1000).optional(),
});

export const punchActionSchema = geoSchema.extend({
  punchType: z.enum(['CHECK_IN', 'CHECK_OUT']),
  source: z.enum(['WEB', 'MOBILE', 'KIOSK', 'ADMIN']).optional(),
  remarks: z.string().max(500).optional(),
  punchedAt: z.string().datetime().optional(),
});

export const overrideStatusSchema = z.object({
  status: attendanceStatusSchema,
  reason: z.string().min(1).max(500),
});

export const manualEntrySchema = z.object({
  firstCheckInAt: z.string().datetime().optional(),
  lastCheckOutAt: z.string().datetime().optional(),
  status: attendanceStatusSchema.optional(),
  reason: z.string().min(1).max(500).optional(),
});

export const reEnableStartWorkSchema = z.object({
  reason: z.string().max(500).optional(),
  validUntil: z.string().datetime().optional(),
});

export const adminOverrideByEmployeeSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  status: attendanceStatusSchema,
  reason: z.string().min(1).max(500),
});

export const adminManualEntryByEmployeeSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  firstCheckInAt: z.string().datetime().optional(),
  lastCheckOutAt: z.string().datetime().optional(),
  status: attendanceStatusSchema.optional(),
  reason: z.string().min(1).max(500).optional(),
});

export const monthlyQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const dateQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
});

export const reviewRequestSchema = z.object({
  approved: z.boolean(),
  adminRemarks: z.string().max(1000).optional(),
});

const attendanceAccessModeSchema = z.enum([
  'GEO_FENCE_ONLY',
  'REMOTE_ALLOWED',
  'HYBRID',
  'ORG_DEFAULT',
]);

export const createRegularizationRequestSchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  requestType: z.enum([
    'MISSING_PUNCH_IN',
    'MISSING_PUNCH_OUT',
    'LATE_PUNCH',
    'EARLY_OUT',
    'GEOFENCE_FAILURE',
    'INCORRECT_STATUS',
    'OTHER',
  ]),
  requestedInTime: z.string().datetime().optional(),
  requestedOutTime: z.string().datetime().optional(),
  reason: z.string().min(1).max(1500),
});

export const createPermissionRequestSchema = z
  .object({
    date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
    fromTime: z.string().regex(timeRegex, 'fromTime must be HH:mm or HH:mm:ss'),
    toTime: z.string().regex(timeRegex, 'toTime must be HH:mm or HH:mm:ss'),
    reason: z.string().min(1).max(1500),
  })
  .refine((data) => data.fromTime < data.toTime, {
    path: ['toTime'],
    message: 'toTime must be later than fromTime',
  });

const classificationConfigSchema = z.object({
  presentMinMinutes: z.number().int().min(1).optional(),
  halfDayMinMinutes: z.number().int().min(1).optional(),
  absentBelowHalfDay: z.boolean().optional(),
  lopBelowHalfDay: z.boolean().optional(),
  markLateByGrace: z.boolean().optional(),
  markEarlyOut: z.boolean().optional(),
  earlyOutToleranceMinutes: z.number().int().min(0).optional(),
  missingPunchStatus: z.enum(['MISSING_PUNCH', 'ABSENT']).optional(),
  holidayPrecedence: z.boolean().optional(),
  leavePrecedence: z.boolean().optional(),
  weeklyOffPrecedence: z.boolean().optional(),
});

const permissionConfigSchema = z.object({
  permissionEnabled: z.boolean().optional(),
  maxPermissionHoursPerMonth: z.number().min(0).optional(),
  maxPermissionRequestsPerMonth: z.number().int().min(0).optional(),
  minPermissionUnitMinutes: z.number().int().min(1).optional(),
  permissionApprovalRequired: z.boolean().optional(),
  canPermissionConvertShortage: z.boolean().optional(),
  permissionAllowedDuringProbation: z.boolean().optional(),
  permissionReasonRequired: z.boolean().optional(),
});

const regularizationConfigSchema = z.object({
  regularizationEnabled: z.boolean().optional(),
  maxRegularizationsPerMonth: z.number().int().min(0).optional(),
  maxRegularizationBackDays: z.number().int().min(0).optional(),
  regularizationApprovalRequired: z.boolean().optional(),
  allowRegularizationForMissingPunch: z.boolean().optional(),
  allowRegularizationForLatePunch: z.boolean().optional(),
  allowRegularizationForGeoFenceFailure: z.boolean().optional(),
  reasonRequired: z.boolean().optional(),
});

export const attendancePolicyUpdateSchema = z.object({
  defaultPolicyName: z.string().min(1).max(180).optional(),
  effectiveFrom: z.string().regex(dateRegex, 'effectiveFrom must be YYYY-MM-DD').optional(),
  workStartTime: z.string().regex(timeRegex, 'workStartTime must be HH:mm or HH:mm:ss').optional(),
  workEndTime: z.string().regex(timeRegex, 'workEndTime must be HH:mm or HH:mm:ss').optional(),
  lateGraceMinutes: z.number().int().min(0).optional(),
  halfDayMinMinutes: z.number().int().min(1).optional(),
  fullDayMinMinutes: z.number().int().min(1).optional(),
  overtimeMinMinutes: z.number().int().min(0).optional(),
  maxEarlyOutToleranceMinutes: z.number().int().min(0).optional(),
  allowMultiplePunchSessions: z.boolean().optional(),
  autoCloseOpenSessionAtEndOfDay: z.boolean().optional(),
  minimumPunchGapMinutes: z.number().int().min(0).optional(),
  officeLatitude: z.number().min(-90).max(90).nullable().optional(),
  officeLongitude: z.number().min(-180).max(180).nullable().optional(),
  allowedRadiusMeters: z.number().int().min(1).nullable().optional(),
  geoFenceRequired: z.boolean().optional(),
  allowAdminOverrideForGeoFenceMiss: z.boolean().optional(),
  allowRemotePunch: z.boolean().optional(),
  defaultAttendanceMode: attendanceAccessModeSchema
    .optional()
    .refine((value) => value !== 'ORG_DEFAULT', {
      message: 'defaultAttendanceMode cannot be ORG_DEFAULT',
    }),
  requireRemotePunchReason: z.boolean().optional(),
  allowEmployeePolicyOverride: z.boolean().optional(),
  captureLocationOnEveryPunch: z.boolean().optional(),
  weekOffDays: z.string().max(200).optional(),
  alternateSaturdayOffRule: z.enum(['NONE', 'SECOND_FOURTH', 'FIRST_THIRD']).optional(),
  classificationConfig: classificationConfigSchema.optional(),
  permissionConfig: permissionConfigSchema.optional(),
  regularizationConfig: regularizationConfigSchema.optional(),
  policyPrecedenceConfig: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const employeeAttendanceAccessOverrideSchema = z
  .object({
    overrideMode: attendanceAccessModeSchema.optional(),
    geoFenceExempt: z.boolean().optional(),
    remotePunchAllowed: z.boolean().nullable().optional(),
    reason: z.string().max(1000).optional(),
    effectiveFrom: z.string().regex(dateRegex, 'effectiveFrom must be YYYY-MM-DD').optional(),
    effectiveUntil: z.string().regex(dateRegex, 'effectiveUntil must be YYYY-MM-DD').optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !(data.effectiveFrom && data.effectiveUntil) || data.effectiveUntil >= data.effectiveFrom,
    {
      path: ['effectiveUntil'],
      message: 'effectiveUntil must be greater than or equal to effectiveFrom',
    },
  );

