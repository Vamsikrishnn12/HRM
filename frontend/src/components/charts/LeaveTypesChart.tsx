"use client";

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { LeaveTypeData } from "@/types";

const BRAND_COLORS = ["#7548b9", "#359de9", "#A58FD8", "#6DBAEF", "#4B2A82", "#2578BA"];

interface LeaveTypesChartProps {
  data?: LeaveTypeData[];
}

export default function LeaveTypesChart({ data: rawData }: LeaveTypesChartProps) {
  const data = useMemo(() => rawData ?? [], [rawData]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={105}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || BRAND_COLORS[index % BRAND_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "14px",
            border: "1px solid #E8E4F0",
            boxShadow: "0 8px 24px rgba(117,72,185,0.10)",
            fontSize: "13px",
            fontFamily: "Plus Jakarta Sans, Manrope, sans-serif",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", color: "#7C7F99", fontFamily: "Plus Jakarta Sans, Manrope, sans-serif" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
