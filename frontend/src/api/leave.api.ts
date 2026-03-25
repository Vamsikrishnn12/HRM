import { api } from "@/lib/api";

// ── Enums / Types ──

export type LeaveType = "CL" | "SL" | "EL" | "LOP" | "PERMISSION";
export type RequestMode = "FULL_DAY" | "HALF_DAY" | "PERMISSION";
export type HalfDaySession = "FN" | "AN";
export type LeaveStatusType = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveSummary {
  employeeId: string;
  employeeName: string;
  empId: string | null;
  dateOfJoining: string;
  department: string;
  designation: string;
  yearsOfService: number;
  monthsOfService: number;
  inProbation: boolean;
  probationEndsOn: string | null;
  probationLeaveAllowed: boolean;
  allowHalfDayLeave: boolean;
  allowPermissionHours: boolean;
  maxPermissionHoursPerMonth: number;
  maxPermissionRequestsPerMonth: number;
  maxRegularizationsPerMonth: number;
  entitlement: { cl: number; sl: number; el: number };
  used: { cl: number; sl: number; el: number; lop: number };
  balance: { cl: number; sl: number; el: number };
  permissionHoursUsedThisMonth: number;
  currentSlab: {
    minYears: number;
    maxYears: number | null;
    cl: number;
    sl: number;
    el: number;
  } | null;
}

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  employeeName: string | null;
  employeeCode: string | null;
  leaveType: LeaveType;
  requestedLeaveType: LeaveType;
  approvedLeaveType: LeaveType | null;
  finalAttendanceCode: string | null;
  suggestedLeaveType: LeaveType | null;
  treatmentNote: string | null;
  requestMode: RequestMode;
  startDate: string | null;
  endDate: string | null;
  date: string | null;
  halfDaySession: HalfDaySession | null;
  fromTime: string | null;
  toTime: string | null;
  totalDays: number | null;
  totalHours: number | null;
  reason: string;
  adminRemarks: string | null;
  status: LeaveStatusType;
  policySnapshot: Record<string, unknown> | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department?: string | null;
  inProbation?: boolean;
}

export interface LeavePolicyData {
  id?: string;
  probationPeriodMonths: number;
  probationLeaveAllowed: boolean;
  allowHalfDayLeave: boolean;
  allowPermissionHours: boolean;
  maxPermissionHoursPerMonth: number;
  maxPermissionRequestsPerMonth: number;
  maxRegularizationsPerMonth: number;
}

export interface LeaveSlabData {
  id?: string;
  minYearsOfService: number;
  maxYearsOfService: number | null;
  casualLeavePerYear: number;
  sickLeavePerYear: number;
  earnedLeavePerYear: number;
}

export interface LeavePolicyResponse {
  policy: LeavePolicyData | null;
  slabs: LeaveSlabData[];
}

export interface EmployeePoliciesResponse {
  policy: {
    probationPeriodMonths: number;
    probationLeaveAllowed: boolean;
    allowHalfDayLeave: boolean;
    allowPermissionHours: boolean;
    maxPermissionHoursPerMonth: number;
    maxPermissionRequestsPerMonth: number;
    maxRegularizationsPerMonth: number;
  } | null;
  slabs: Array<{
    minYears: number;
    maxYears: number | null;
    cl: number;
    sl: number;
    el: number;
  }>;
  applicableSlab: {
    minYears: number;
    maxYears: number | null;
    cl: number;
    sl: number;
    el: number;
  } | null;
}

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  requestMode: RequestMode;
  startDate?: string;
  endDate?: string;
  date?: string;
  halfDaySession?: HalfDaySession;
  fromTime?: string;
  toTime?: string;
  reason: string;
}

export interface AdminRequestsResponse {
  requests: LeaveRequestRecord[];
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// ── API Client ──

export const leaveApi = {
  // Employee
  getMySummary: () => api.get<LeaveSummary>("/leave/me/summary"),

  getMyPolicies: () => api.get<EmployeePoliciesResponse>("/leave/me/policies"),

  getMyHistory: () => api.get<LeaveRequestRecord[]>("/leave/me/history"),

  applyLeave: (data: ApplyLeavePayload) =>
    api.post<LeaveRequestRecord>("/leave/me/apply", data),

  cancelLeave: (id: string) =>
    api.patch<LeaveRequestRecord>(`/leave/me/${id}/cancel`),

  // Admin
  getAdminRequests: (filters?: {
    status?: string;
    leaveType?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const qs = params.toString();
    return api.get<AdminRequestsResponse>(`/leave/admin/requests${qs ? `?${qs}` : ""}`);
  },

  getAdminRequestDetail: (id: string) =>
    api.get<LeaveRequestRecord>(`/leave/admin/requests/${id}`),

  approveRequest: (id: string, data?: { remarks?: string; approvedLeaveType?: LeaveType }) =>
    api.patch<LeaveRequestRecord>(`/leave/admin/requests/${id}/approve`, data ?? {}),

  rejectRequest: (id: string, remarks?: string) =>
    api.patch<LeaveRequestRecord>(`/leave/admin/requests/${id}/reject`, { remarks }),

  overrideRequest: (
    id: string,
    data: { status: string; remarks?: string; leaveType?: string; approvedLeaveType?: LeaveType },
  ) =>
    api.patch<LeaveRequestRecord>(`/leave/admin/requests/${id}/override`, data),

  // Policy
  getPolicy: () => api.get<LeavePolicyResponse>("/leave/admin/policies"),

  updatePolicy: (data: {
    probationPeriodMonths?: number;
    probationLeaveAllowed?: boolean;
    allowHalfDayLeave?: boolean;
    allowPermissionHours?: boolean;
    maxPermissionHoursPerMonth?: number;
    maxPermissionRequestsPerMonth?: number;
    maxRegularizationsPerMonth?: number;
    slabs?: Array<{
      minYearsOfService: number;
      maxYearsOfService: number | null;
      casualLeavePerYear: number;
      sickLeavePerYear: number;
      earnedLeavePerYear: number;
    }>;
  }) => api.put<LeavePolicyResponse>("/leave/admin/policies", data),
};
