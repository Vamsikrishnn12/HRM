export const DEFAULT_ORGANIZATION_ID = 'ORG_DEFAULT';

export enum AttendancePunchType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export enum AttendancePunchSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  KIOSK = 'KIOSK',
  ADMIN = 'ADMIN',
}

export enum AttendanceDayType {
  WORKING = 'WORKING',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
  LEAVE = 'LEAVE',
}

export enum AttendanceFinalStatus {
  PRESENT = 'PRESENT',
  HALF_DAY = 'HALF_DAY',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
  PERMISSION = 'PERMISSION',
  REGULARIZED = 'REGULARIZED',
  LOP = 'LOP',
  MISSING_PUNCH = 'MISSING_PUNCH',
  EARLY_OUT = 'EARLY_OUT',
  OVERTIME = 'OVERTIME',
  NOT_STARTED = 'NOT_STARTED',
}

export enum AttendanceRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum AttendanceRegularizationRequestType {
  MISSING_PUNCH_IN = 'MISSING_PUNCH_IN',
  MISSING_PUNCH_OUT = 'MISSING_PUNCH_OUT',
  LATE_PUNCH = 'LATE_PUNCH',
  EARLY_OUT = 'EARLY_OUT',
  GEOFENCE_FAILURE = 'GEOFENCE_FAILURE',
  INCORRECT_STATUS = 'INCORRECT_STATUS',
  OTHER = 'OTHER',
}

export enum AttendanceAccessMode {
  GEO_FENCE_ONLY = 'GEO_FENCE_ONLY',
  REMOTE_ALLOWED = 'REMOTE_ALLOWED',
  HYBRID = 'HYBRID',
  ORG_DEFAULT = 'ORG_DEFAULT',
}

export interface AttendancePermissionConfig {
  permissionEnabled: boolean;
  maxPermissionHoursPerMonth: number;
  maxPermissionRequestsPerMonth: number;
  minPermissionUnitMinutes: number;
  permissionApprovalRequired: boolean;
  canPermissionConvertShortage: boolean;
  permissionAllowedDuringProbation: boolean;
  permissionReasonRequired: boolean;
}

export interface AttendanceRegularizationConfig {
  regularizationEnabled: boolean;
  maxRegularizationsPerMonth: number;
  maxRegularizationBackDays: number;
  regularizationApprovalRequired: boolean;
  allowRegularizationForMissingPunch: boolean;
  allowRegularizationForLatePunch: boolean;
  allowRegularizationForGeoFenceFailure: boolean;
  reasonRequired: boolean;
}

export interface AttendanceClassificationConfig {
  presentMinMinutes: number;
  halfDayMinMinutes: number;
  absentBelowHalfDay: boolean;
  lopBelowHalfDay: boolean;
  markLateByGrace: boolean;
  markEarlyOut: boolean;
  earlyOutToleranceMinutes: number;
  missingPunchStatus: 'MISSING_PUNCH' | 'ABSENT';
  holidayPrecedence: boolean;
  leavePrecedence: boolean;
  weeklyOffPrecedence: boolean;
}
