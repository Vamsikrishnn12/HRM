"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Box, Flex, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { Calendar, Megaphone, Info, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import UpcomingBirthdaysWidget from "@/components/ui/UpcomingBirthdaysWidget";
import UpcomingHolidaysWidget from "@/components/ui/UpcomingHolidaysWidget";
import { dashboardApi, type DashboardSummary } from "@/api";
import type { AttendanceRecord } from "@/types";

const AttendanceChart = dynamic(() => import("@/components/charts/AttendanceChart"), { ssr: false });
const DepartmentChart = dynamic(() => import("@/components/charts/DepartmentChart"), { ssr: false });
const LeaveTypesChart = dynamic(() => import("@/components/charts/LeaveTypesChart"), { ssr: false });

const announcementIcons: Record<string, typeof Info> = {
  info: Info,
  holiday: Calendar,
  update: RefreshCw,
  event: Megaphone,
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const attendanceColumns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      { key: "id", header: "Emp ID", width: "80px" },
      { key: "name", header: "Name" },
      { key: "department", header: "Department" },
      { key: "checkIn", header: "Check In", width: "80px" },
      { key: "checkOut", header: "Check Out", width: "80px" },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    []
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="brand.400" />
      </Flex>
    );
  }

  const KEEP_LABELS = new Set(["Total Employees", "Present Today", "Late Arrivals", "Payroll Processed"]);
  const kpiStats = (data?.kpiStats ?? []).filter((s) => KEEP_LABELS.has(s.label));
  const recentAttendance = data?.recentAttendance ?? [];
  const announcements = data?.announcements ?? [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
      />

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6} mb={8}>
        {kpiStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </SimpleGrid>

      {/* Charts Row */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={8}>
        <SectionCard title="Attendance Trend (14 Days)">
          <AttendanceChart data={data?.attendanceTrend} />
        </SectionCard>
        <SectionCard title="Department Headcount">
          <DepartmentChart data={data?.departmentData} />
        </SectionCard>
      </SimpleGrid>

      {/* Leave Chart + Sidebar */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={8}>
        <SectionCard title="Leave Distribution">
          <LeaveTypesChart data={data?.leaveTypesData} />
        </SectionCard>

        {/* Announcements */}
        <SectionCard title="Announcements">
          <VStack spacing={3} align="stretch">
            {announcements.map((a, i) => {
              const Icon = announcementIcons[a.type] ?? Info;
              return (
                <Flex
                  key={i}
                  align="center"
                  gap={3}
                  p={3}
                  borderRadius="xl"
                  bg="surface.bg"
                  _hover={{ bg: "brand.50", transform: "translateX(2px)" }}
                  transition="all 0.25s cubic-bezier(.4,0,.2,1)"
                  cursor="pointer"
                >
                  <Flex
                    w={8}
                    h={8}
                    borderRadius="xl"
                    bgGradient="linear(135deg, #7548b9, #359de9)"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon size={14} color="white" />
                  </Flex>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="700" color="text.heading">
                      {a.title}
                    </Text>
                    <Text fontSize="xs" color="text.muted" fontWeight="500">
                      {a.date}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </SectionCard>
      </SimpleGrid>

      {/* Birthdays & Holidays Widgets */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={8}>
        <UpcomingBirthdaysWidget />
        <UpcomingHolidaysWidget />
      </SimpleGrid>

      {/* Recent Attendance Table */}
      <SectionCard title="Recent Attendance" noPadding>
        <DataTable<AttendanceRecord>
          columns={attendanceColumns}
          data={recentAttendance}
          keyField="id"
        />
      </SectionCard>
    </Box>
  );
}
