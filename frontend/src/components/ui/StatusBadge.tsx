"use client";

import { Badge } from "@chakra-ui/react";

type StatusType =
  | "Present"
  | "Absent"
  | "Late"
  | "Half Day"
  | "Active"
  | "On Leave"
  | "Inactive"
  | "Approved"
  | "Pending"
  | "Rejected"
  | "Processed"
  | "On Hold"
  | "Holiday"
  | "Week Off"
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEK_OFF";

const variantMap: Record<StatusType, string> = {
  Present: "success",
  Active: "success",
  Approved: "success",
  Processed: "success",
  Pending: "warning",
  "On Leave": "warning",
  "Half Day": "warning",
  "On Hold": "warning",
  Late: "warning",
  Absent: "danger",
  Inactive: "danger",
  Rejected: "danger",
  Holiday: "success",
  "Week Off": "info",
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "danger",
  HALF_DAY: "warning",
  LEAVE: "info",
  HOLIDAY: "success",
  WEEK_OFF: "info",
};

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = variantMap[status] ?? "info";
  return <Badge variant={variant}>{status}</Badge>;
}
