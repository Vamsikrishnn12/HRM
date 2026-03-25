import { AlternateSaturdayRule } from '../entities/OrgSettings.entity';
import {
  AttendanceAccessMode,
  AttendanceClassificationConfig,
  AttendancePermissionConfig,
  AttendanceRegularizationConfig,
} from './attendance.enums';

export interface AttendancePolicyDefaultsInput {
  workStartTime?: string;
  workEndTime?: string;
  lateGraceMinutes?: number;
  halfDayMinMinutes?: number;
  fullDayMinMinutes?: number;
  officeLatitude?: number | null;
  officeLongitude?: number | null;
  officeRadiusMeters?: number | null;
  weekOffDays?: string;
  alternateSaturdayOffRule?: AlternateSaturdayRule;
}

export const buildDefaultAttendancePolicy = (
  input?: AttendancePolicyDefaultsInput,
) => {
  const classificationConfig: AttendanceClassificationConfig = {
    presentMinMinutes: input?.fullDayMinMinutes ?? 480,
    halfDayMinMinutes: input?.halfDayMinMinutes ?? 240,
    absentBelowHalfDay: true,
    lopBelowHalfDay: false,
    markLateByGrace: true,
    markEarlyOut: true,
    earlyOutToleranceMinutes: 15,
    missingPunchStatus: 'MISSING_PUNCH',
    holidayPrecedence: true,
    leavePrecedence: true,
    weeklyOffPrecedence: true,
  };

  const permissionConfig: AttendancePermissionConfig = {
    permissionEnabled: true,
    maxPermissionHoursPerMonth: 2,
    maxPermissionRequestsPerMonth: 4,
    minPermissionUnitMinutes: 30,
    permissionApprovalRequired: true,
    canPermissionConvertShortage: true,
    permissionAllowedDuringProbation: true,
    permissionReasonRequired: true,
  };

  const regularizationConfig: AttendanceRegularizationConfig = {
    regularizationEnabled: true,
    maxRegularizationsPerMonth: 4,
    maxRegularizationBackDays: 10,
    regularizationApprovalRequired: true,
    allowRegularizationForMissingPunch: true,
    allowRegularizationForLatePunch: true,
    allowRegularizationForGeoFenceFailure: true,
    reasonRequired: true,
  };

  return {
    defaultPolicyName: 'Default Attendance Policy',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    workStartTime: input?.workStartTime ?? '09:00',
    workEndTime: input?.workEndTime ?? '18:00',
    lateGraceMinutes: input?.lateGraceMinutes ?? 15,
    halfDayMinMinutes: input?.halfDayMinMinutes ?? 240,
    fullDayMinMinutes: input?.fullDayMinMinutes ?? 480,
    overtimeMinMinutes: 30,
    maxEarlyOutToleranceMinutes: 15,
    allowMultiplePunchSessions: true,
    autoCloseOpenSessionAtEndOfDay: true,
    minimumPunchGapMinutes: 5,
    officeLatitude: input?.officeLatitude ?? null,
    officeLongitude: input?.officeLongitude ?? null,
    allowedRadiusMeters: input?.officeRadiusMeters ?? null,
    geoFenceRequired: true,
    allowAdminOverrideForGeoFenceMiss: true,
    allowRemotePunch: false,
    defaultAttendanceMode: AttendanceAccessMode.GEO_FENCE_ONLY,
    requireRemotePunchReason: false,
    allowEmployeePolicyOverride: true,
    captureLocationOnEveryPunch: true,
    weekOffDays: input?.weekOffDays ?? 'SUNDAY',
    alternateSaturdayOffRule:
      input?.alternateSaturdayOffRule ?? AlternateSaturdayRule.NONE,
    classificationConfig,
    permissionConfig,
    regularizationConfig,
    policyPrecedenceConfig: {
      order: [
        'HOLIDAY',
        'WEEK_OFF',
        'LEAVE',
        'WORK_HOURS',
        'PERMISSION_ADJUSTMENT',
        'REGULARIZATION_ADJUSTMENT',
      ],
    },
  };
};
