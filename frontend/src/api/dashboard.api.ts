import { api } from "@/lib/api";
import type {
  KpiStat,
  AttendanceTrend,
  DepartmentData,
  LeaveTypeData,
  AttendanceRecord,
  Announcement,
  Holiday,
} from "@/types";

export interface PayrollProcessed {
  totalRecords: number;
  generatedCount: number;
  totalPayout: number;
  month: string;
  year: number;
  isRun: boolean;
}

export interface DashboardSummary {
  kpiStats: KpiStat[];
  payrollProcessed: PayrollProcessed;
  attendanceTrend: AttendanceTrend[];
  departmentData: DepartmentData[];
  leaveTypesData: LeaveTypeData[];
  recentAttendance: AttendanceRecord[];
  announcements: Announcement[];
  upcomingHolidays: Holiday[];
}

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>("/dashboard"),
};
