"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AttendanceTrend } from "@/types";

interface AttendanceChartProps {
  data?: AttendanceTrend[];
}

export default function AttendanceChart({ data: rawData }: AttendanceChartProps) {
  const data = useMemo(() => rawData ?? [], [rawData]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#30B8E9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#30B8E9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E1E7F5" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#6B7A99", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6B7A99", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #E1E7F5",
            boxShadow: "0 4px 12px rgba(27,41,89,0.08)",
            fontSize: "13px",
          }}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="#30B8E9"
          strokeWidth={2}
          fill="url(#colorPresent)"
          name="Present"
        />
        <Area
          type="monotone"
          dataKey="absent"
          stroke="#C41E3A"
          strokeWidth={2}
          fill="url(#colorAbsent)"
          name="Absent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
