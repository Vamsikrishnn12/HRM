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
  | "On Hold";

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
};

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const variant = variantMap[status] ?? "info";
  return <Badge variant={variant}>{status}</Badge>;
}
