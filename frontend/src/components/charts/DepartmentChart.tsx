"use client";

import { useMemo } from "react";
import { Flex, Text } from "@chakra-ui/react";
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
          No department data available
        </Text>
        <Text fontSize="xs" color="text.muted" fontWeight="500">
          Headcount distribution will appear once departments are assigned.
        </Text>
      </Flex>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B72E7" stopOpacity={1} />
            <stop offset="100%" stopColor="#20C997" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#DDE7F0" vertical={false} />
        <XAxis
          dataKey="department"
          tick={{ fill: "#708399", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
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
