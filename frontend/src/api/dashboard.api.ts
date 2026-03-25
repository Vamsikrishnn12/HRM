import { api } from "@/lib/api";
import type {
  KpiStat,
  AttendanceTrend,
  DepartmentData,
  AttendanceBreakdown,
  AttendanceRecord,
  Announcement,
  Holiday,
} from "@/types";

export interface PayrollProcessed {
  status: "NOT_RUN" | "PENDING" | "PARTIAL" | "COMPLETED";
  statusLabel: string;
  progressPercent: number | null;
  expectedEmployees: number;
  totalRecords: number;
  generatedCount: number;
  failedCount: number;
  draftCount: number;
  emailedCount: number;
  totalPayout: number;
  month: string;
  year: number;
  isRun: boolean;
  latestRunStatus: string | null;
}

export interface DashboardSummary {
  kpiStats: KpiStat[];
  payrollProcessed: PayrollProcessed;
  attendanceTrend: AttendanceTrend[];
  departmentData: DepartmentData[];
  attendanceBreakdown: AttendanceBreakdown;
  pendingLeaveCount: number;
  recentAttendance: AttendanceRecord[];
  announcements: Announcement[];
  upcomingHolidays: Holiday[];
}

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>("/dashboard"),
};
