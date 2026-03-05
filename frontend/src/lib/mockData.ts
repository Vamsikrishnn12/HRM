// ── KPI Stats ──
import type {
  AttendanceRecord,
  Employee,
  LeaveRequest,
  PayrollRecord,
} from "@/types";

export type { AttendanceRecord, Employee, LeaveRequest, PayrollRecord };

export const kpiStats = [
  { label: "Total Employees", value: "248", change: "+12", changeType: "up" as const, icon: "Users" },
  { label: "Present Today", value: "213", change: "85.8%", changeType: "up" as const, icon: "UserCheck" },
  { label: "Pending Leaves", value: "18", change: "+3", changeType: "down" as const, icon: "CalendarOff" },
  { label: "Payroll Processed", value: "$1.2M", change: "Feb 2026", changeType: "neutral" as const, icon: "Wallet" },
  { label: "Late Arrivals", value: "7", change: "-2", changeType: "up" as const, icon: "Clock" },
  { label: "Open Requests", value: "24", change: "+5", changeType: "down" as const, icon: "FileText" },
];

// ── Attendance Trend (last 14 days) ──
export const attendanceTrend = [
  { date: "Feb 17", present: 210, absent: 18, late: 8 },
  { date: "Feb 18", present: 215, absent: 15, late: 6 },
  { date: "Feb 19", present: 220, absent: 12, late: 5 },
  { date: "Feb 20", present: 208, absent: 22, late: 10 },
  { date: "Feb 21", present: 225, absent: 10, late: 4 },
  { date: "Feb 22", present: 198, absent: 30, late: 12 },
  { date: "Feb 23", present: 200, absent: 28, late: 11 },
  { date: "Feb 24", present: 218, absent: 14, late: 7 },
  { date: "Feb 25", present: 222, absent: 12, late: 5 },
  { date: "Feb 26", present: 230, absent: 8, late: 3 },
  { date: "Feb 27", present: 215, absent: 16, late: 9 },
  { date: "Feb 28", present: 213, absent: 18, late: 7 },
  { date: "Mar 01", present: 220, absent: 14, late: 6 },
  { date: "Mar 02", present: 213, absent: 17, late: 7 },
];

// ── Department Headcount ──
export const departmentData = [
  { department: "Engineering", count: 64 },
  { department: "Marketing", count: 32 },
  { department: "Sales", count: 45 },
  { department: "HR", count: 18 },
  { department: "Finance", count: 28 },
  { department: "Operations", count: 36 },
  { department: "Design", count: 25 },
];

// ── Leave Types Distribution ──
export const leaveTypesData = [
  { name: "Casual Leave", value: 38, color: "#8B5CF6" },
  { name: "Sick Leave", value: 24, color: "#6D28D9" },
  { name: "Earned Leave", value: 18, color: "#A785FA" },
  { name: "Maternity", value: 6, color: "#C4ADFC" },
  { name: "Unpaid", value: 8, color: "#64748B" },
];

// ── Recent Attendance ──
export const recentAttendance: AttendanceRecord[] = [
  { id: "EMP001", name: "Sarah Johnson", department: "Engineering", date: "Mar 02", checkIn: "09:02", checkOut: "18:15", status: "Present" },
  { id: "EMP002", name: "Michael Chen", department: "Marketing", date: "Mar 02", checkIn: "09:45", checkOut: "18:00", status: "Late" },
  { id: "EMP003", name: "Emily Davis", department: "Sales", date: "Mar 02", checkIn: "—", checkOut: "—", status: "Absent" },
  { id: "EMP004", name: "James Wilson", department: "HR", date: "Mar 02", checkIn: "08:55", checkOut: "18:30", status: "Present" },
  { id: "EMP005", name: "Lisa Anderson", department: "Finance", date: "Mar 02", checkIn: "09:00", checkOut: "13:00", status: "Half Day" },
  { id: "EMP006", name: "Robert Taylor", department: "Engineering", date: "Mar 02", checkIn: "08:50", checkOut: "18:10", status: "Present" },
];

// ── Announcements ──
export const announcements = [
  { title: "Annual Performance Review", date: "Mar 05, 2026", type: "info" as const },
  { title: "Office Closed — Holi Festival", date: "Mar 14, 2026", type: "holiday" as const },
  { title: "New Health Insurance Policy", date: "Mar 10, 2026", type: "update" as const },
  { title: "Q1 Town Hall Meeting", date: "Mar 20, 2026", type: "event" as const },
];

// ── Upcoming Holidays ──
export const upcomingHolidays = [
  { name: "Holi", date: "Mar 14", day: "Saturday" },
  { name: "Good Friday", date: "Apr 03", day: "Friday" },
  { name: "Eid ul-Fitr", date: "Apr 10", day: "Friday" },
  { name: "Labour Day", date: "May 01", day: "Friday" },
];

// ── Employees List ──
export const employees: Employee[] = [
  { id: "EMP001", name: "Sarah Johnson", email: "sarah.j@hrms.com", department: "Engineering", designation: "Sr. Developer", status: "Active", joinDate: "2023-03-15" },
  { id: "EMP002", name: "Michael Chen", email: "michael.c@hrms.com", department: "Marketing", designation: "Marketing Lead", status: "Active", joinDate: "2022-08-01" },
  { id: "EMP003", name: "Emily Davis", email: "emily.d@hrms.com", department: "Sales", designation: "Sales Executive", status: "On Leave", joinDate: "2024-01-10" },
  { id: "EMP004", name: "James Wilson", email: "james.w@hrms.com", department: "HR", designation: "HR Manager", status: "Active", joinDate: "2021-06-20" },
  { id: "EMP005", name: "Lisa Anderson", email: "lisa.a@hrms.com", department: "Finance", designation: "Accountant", status: "Active", joinDate: "2023-09-05" },
  { id: "EMP006", name: "Robert Taylor", email: "robert.t@hrms.com", department: "Engineering", designation: "DevOps Engineer", status: "Active", joinDate: "2022-11-12" },
  { id: "EMP007", name: "Amanda White", email: "amanda.w@hrms.com", department: "Design", designation: "UI/UX Designer", status: "Active", joinDate: "2024-02-28" },
  { id: "EMP008", name: "David Brown", email: "david.b@hrms.com", department: "Operations", designation: "Ops Manager", status: "Inactive", joinDate: "2020-04-18" },
  { id: "EMP009", name: "Jennifer Martinez", email: "jennifer.m@hrms.com", department: "Engineering", designation: "Frontend Dev", status: "Active", joinDate: "2023-07-22" },
  { id: "EMP010", name: "Christopher Lee", email: "chris.l@hrms.com", department: "Sales", designation: "Account Manager", status: "Active", joinDate: "2022-12-01" },
];

// ── Leave Requests ──
export const leaveRequests: LeaveRequest[] = [
  { id: "LR001", employeeName: "Sarah Johnson", type: "Casual Leave", from: "Mar 05", to: "Mar 06", days: 2, reason: "Personal work", status: "Pending", appliedOn: "Mar 01" },
  { id: "LR002", employeeName: "Michael Chen", type: "Sick Leave", from: "Feb 28", to: "Feb 28", days: 1, reason: "Not feeling well", status: "Approved", appliedOn: "Feb 28" },
  { id: "LR003", employeeName: "Emily Davis", type: "Earned Leave", from: "Mar 10", to: "Mar 14", days: 5, reason: "Family vacation", status: "Pending", appliedOn: "Feb 25" },
  { id: "LR004", employeeName: "James Wilson", type: "Casual Leave", from: "Feb 20", to: "Feb 20", days: 1, reason: "Doctor appointment", status: "Approved", appliedOn: "Feb 18" },
  { id: "LR005", employeeName: "Lisa Anderson", type: "Sick Leave", from: "Feb 22", to: "Feb 23", days: 2, reason: "Flu", status: "Approved", appliedOn: "Feb 22" },
  { id: "LR006", employeeName: "Robert Taylor", type: "Casual Leave", from: "Mar 08", to: "Mar 08", days: 1, reason: "Moving house", status: "Rejected", appliedOn: "Feb 27" },
  { id: "LR007", employeeName: "Amanda White", type: "Earned Leave", from: "Mar 15", to: "Mar 20", days: 6, reason: "Travel", status: "Pending", appliedOn: "Mar 01" },
];

// ── Payroll Data ──
export const payrollRecords: PayrollRecord[] = [
  { id: "PAY001", employeeName: "Sarah Johnson", department: "Engineering", basicSalary: 8500, allowances: 1200, deductions: 950, netPay: 8750, status: "Processed", month: "Feb 2026" },
  { id: "PAY002", employeeName: "Michael Chen", department: "Marketing", basicSalary: 7200, allowances: 1000, deductions: 820, netPay: 7380, status: "Processed", month: "Feb 2026" },
  { id: "PAY003", employeeName: "Emily Davis", department: "Sales", basicSalary: 6000, allowances: 800, deductions: 680, netPay: 6120, status: "Pending", month: "Feb 2026" },
  { id: "PAY004", employeeName: "James Wilson", department: "HR", basicSalary: 9000, allowances: 1500, deductions: 1050, netPay: 9450, status: "Processed", month: "Feb 2026" },
  { id: "PAY005", employeeName: "Lisa Anderson", department: "Finance", basicSalary: 7500, allowances: 1100, deductions: 860, netPay: 7740, status: "On Hold", month: "Feb 2026" },
  { id: "PAY006", employeeName: "Robert Taylor", department: "Engineering", basicSalary: 8000, allowances: 1200, deductions: 920, netPay: 8280, status: "Processed", month: "Feb 2026" },
];
