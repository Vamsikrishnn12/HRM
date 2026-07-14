"use client";

import { useMemo } from "react";
import { Flex, Text } from "@chakra-ui/react";
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
  if (data.length === 0) {
    return (
      <Flex
        h="280px"
        borderRadius="xl"
        border="1px dashed"
        borderColor="surface.border"
        bg="surface.bg"
        align="center"
        justify="center"
        direction="column"
        gap={1.5}
      >
        <Text fontSize="sm" fontWeight="700" color="text.heading">
          No attendance trend available
        </Text>
        <Text fontSize="xs" color="text.muted" fontWeight="500">
          Trend will appear after attendance records are available.
        </Text>
      </Flex>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0B72E7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0B72E7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#DDE7F0" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#708399", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#708399", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "14px",
            border: "1px solid #DDE7F0",
            boxShadow: "0 8px 24px rgba(11,114,231,0.10)",
            fontSize: "13px",
            fontFamily: "Plus Jakarta Sans, Manrope, sans-serif",
          }}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="#0B72E7"
          strokeWidth={2.5}
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
