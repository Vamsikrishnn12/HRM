import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCog,
  Banknote,
  FileText,
  Eye,
  CalendarCheck,
  CalendarOff,
  Wallet,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface RouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: RouteItem[];
}

export const adminRoutes: RouteItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Employees",
    href: "/admin/employees",
    icon: Users,
    children: [
      { label: "Employee Details", href: "/admin/employees/add", icon: UserPlus },
      { label: "Personal Details", href: "/admin/employees/personal", icon: UserCog },
      { label: "Salary & Banking", href: "/admin/employees/salary", icon: Banknote },
      { label: "Documents", href: "/admin/employees/documents", icon: FileText },
     
    ],
  },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { label: "Leave", href: "/admin/leave", icon: CalendarOff },
  { label: "Payroll", href: "/admin/payroll", icon: Wallet },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const employeeRoutes: RouteItem[] = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/employee/attendance", icon: CalendarCheck },
  { label: "Leave", href: "/employee/leave", icon: CalendarOff },
  { label: "Payroll", href: "/employee/payroll", icon: Wallet },
  { label: "Profile", href: "/employee/profile", icon: UserCircle },
];

