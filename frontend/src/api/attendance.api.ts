import { api } from "@/lib/api";

// ── Types ──

export type AttendanceStatusType =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEK_OFF"
  | "NOT_STARTED"
  | "MISSED_CHECK_IN";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  firstCheckInAt: string | null;
  lastCheckOutAt: string | null;
  totalWorkMinutes: number;
  status: AttendanceStatusType;
  lateMinutes: number;
  isManualOverride: boolean;
  locationValidated: boolean;
  eodDescription: string | null;
}

export type ReasonCode =
  | "HOLIDAY"
  | "WEEK_OFF"
  | "ON_LEAVE"
  | "ALREADY_STARTED"
  | "OVERRIDE_ACTIVE"
  | "BEFORE_START_TIME"
  | "WITHIN_WINDOW"
  | "WINDOW_EXPIRED";

export interface TodayAttendanceResponse {
  date: string;
  dayType: "WORKING" | "HOLIDAY" | "WEEK_OFF";
  workStartTime: string;
  workEndTime: string;
  lateGraceMinutes: number;
  checkInWindowMinutes: number;
  canStartWork: boolean;
  isTooLate: boolean;
  reasonCode: ReasonCode;
  reasonMessage: string;
  todayStatus: string;
  overrideActive: boolean;
  attendance: AttendanceRecord | null;
}

export interface AdminAttendanceRecord {
  id: string | null;
  employeeId: string;
  employeeName: string | null;
  employeeCode: string | null;
  date: string;
  firstCheckInAt: string | null;
  lastCheckOutAt: string | null;
  totalWorkMinutes: number;
  status: AttendanceStatusType;
  lateMinutes: number;
  isManualOverride: boolean;
  overrideReason: string | null;
  locationValidated: boolean;
  eodDescription: string | null;
  startWorkOverrideEnabled: boolean;
  overrideActive: boolean;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
}

export interface AdminAttendanceResponse {
  summary: Record<string, number>;
  records: AdminAttendanceRecord[];
}

// ── Employee API ──

export const attendanceApi = {
  getMyToday: () => api.get<TodayAttendanceResponse>("/attendance/me/today"),

  startWork: (data?: { latitude?: number; longitude?: number }) =>
    api.post<AttendanceRecord>("/attendance/me/start-work", data ?? {}),

  endWork: (data?: { latitude?: number; longitude?: number; eodDescription?: string }) =>
    api.post<AttendanceRecord>("/attendance/me/end-work", data ?? {}),

  getMyHistory: (days = 30) =>
    api.get<AttendanceRecord[]>(`/attendance/me/history?days=${days}`),

  // ── Admin API ──

  getAdminAttendance: (date: string, status?: string, search?: string) => {
    const params = new URLSearchParams({ date });
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    return api.get<AdminAttendanceResponse>(`/attendance/admin?${params.toString()}`);
  },

  getAdminEmployeeAttendance: (employeeId: string, days = 30) =>
    api.get<AttendanceRecord[]>(`/attendance/admin/${employeeId}?days=${days}`),

  overrideStatus: (employeeId: string, data: { date: string; status: string; reason: string }) =>
    api.patch<AdminAttendanceRecord>(`/attendance/admin/${employeeId}/status`, data),

  manualEntry: (
    employeeId: string,
    data: {
      date: string;
      firstCheckInAt?: string;
      lastCheckOutAt?: string;
      status?: string;
      reason?: string;
    },
  ) => api.patch<AdminAttendanceRecord>(`/attendance/admin/${employeeId}/manual-entry`, data),

  reEnableStartWork: (employeeId: string, data?: { reason?: string; validUntil?: string }) =>
    api.patch(`/attendance/admin/${employeeId}/re-enable-start-work`, data ?? {}),
};
