"use client";

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { leaveTypesData } from "@/lib/mockData";

export default function LeaveTypesChart() {
  const data = useMemo(() => leaveTypesData, []);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #EEEEF4",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "13px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", color: "#516079" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
