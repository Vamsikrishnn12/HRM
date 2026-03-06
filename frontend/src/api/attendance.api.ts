import { api } from "@/lib/api";

// ── Types ──

export type AttendanceStatusType =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEK_OFF";

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

export interface TodayAttendanceResponse {
  date: string;
  dayType: "WORKING" | "HOLIDAY" | "WEEK_OFF";
  workStartTime: string;
  workEndTime: string;
  lateGraceMinutes: number;
  canStartWork: boolean;
  isTooLate: boolean;
  attendance: AttendanceRecord | null;
}

export interface AdminAttendanceRecord extends AttendanceRecord {
  employeeName: string | null;
  employeeCode: string | null;
  overrideReason: string | null;
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

  overrideStatus: (attendanceId: string, data: { status: string; reason: string }) =>
    api.patch<AdminAttendanceRecord>(`/attendance/admin/${attendanceId}/status`, data),

  manualEntry: (
    attendanceId: string,
    data: {
      firstCheckInAt?: string;
      lastCheckOutAt?: string;
      status?: string;
      reason?: string;
    },
  ) => api.patch<AdminAttendanceRecord>(`/attendance/admin/${attendanceId}/manual-entry`, data),
};
