import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface RouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminRoutes: RouteItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { label: "Leave", href: "/admin/leave", icon: CalendarOff },
  { label: "Payroll", href: "/admin/payroll", icon: Wallet },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const employeeRoutes: RouteItem[] = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
];
