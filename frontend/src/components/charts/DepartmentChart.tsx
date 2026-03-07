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
        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEF4" vertical={false} />
        <XAxis
          dataKey="department"
          tick={{ fill: "#516079", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "#516079", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #EEEEF4",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "13px",
          }}
        />
        <Bar
          dataKey="count"
          fill="#8B5CF6"
          radius={[6, 6, 0, 0]}
          barSize={32}
          name="Headcount"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
