"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DepartmentData } from "@/types";

interface DepartmentChartProps {
  data?: DepartmentData[];
}

export default function DepartmentChart({ data: rawData }: DepartmentChartProps) {
  const data = useMemo(() => rawData ?? [], [rawData]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7548b9" stopOpacity={1} />
            <stop offset="100%" stopColor="#359de9" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4F0" vertical={false} />
        <XAxis
          dataKey="department"
          tick={{ fill: "#7C7F99", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "#7C7F99", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "14px",
            border: "1px solid #E8E4F0",
            boxShadow: "0 8px 24px rgba(117,72,185,0.10)",
            fontSize: "13px",
            fontFamily: "Plus Jakarta Sans, Manrope, sans-serif",
          }}
        />
        <Bar
          dataKey="count"
          fill="url(#barGradient)"
          radius={[8, 8, 0, 0]}
          barSize={32}
          name="Headcount"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
