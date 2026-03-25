// ── Dashboard / mock data types ──

export interface AttendanceRecord {
  id: string;
  name: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Holiday" | "Week Off" | "LOP";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
}

export interface PayrollRecord {
  id: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "Processed" | "Pending" | "On Hold";
  month: string;
}

export interface KpiStat {
  label: string;
  value: string;
  change?: string;
  changeType: "up" | "down" | "neutral";
  icon: string;
  progress?: number | null;
  caption?: string;
}

export interface Announcement {
  title: string;
  date: string;
  type: "info" | "holiday" | "update" | "event";
}

export interface Holiday {
  name: string;
  date: string;
  day: string;
}

export interface DepartmentData {
  department: string;
  count: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceBreakdown {
  present: number;
  halfDay: number;
  leave: number;
  lop: number;
  weekOff: number;
  holiday: number;
  absent: number;
  late: number;
  total: number;
  date: string;
}
