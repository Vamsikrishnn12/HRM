"use client";

import { useMemo } from "react";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { Calendar } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { recentAttendance, type AttendanceRecord } from "@/lib/mockData";

export default function AttendancePage() {
  const columns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      { key: "id", header: "Emp ID", width: "90px" },
      {
        key: "name",
        header: "Employee",
        render: (row) => (
          <Box>
            <Text fontWeight="600" color="text.heading" fontSize="sm">
              {row.name}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {row.department}
            </Text>
          </Box>
        ),
      },
      { key: "date", header: "Date", width: "90px" },
      { key: "checkIn", header: "Check In", width: "90px" },
      { key: "checkOut", header: "Check Out", width: "90px" },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle="Track daily attendance records"
      />

      <SectionCard noPadding>
        <Flex gap={3} p={5} pb={0} align="center">
          <Flex align="center" gap={2}>
            <Calendar size={16} color="#516079" />
            <Text fontSize="sm" color="text.muted" fontWeight="500">
              Date:
            </Text>
          </Flex>
          <Input
            type="date"
            defaultValue="2026-03-02"
            maxW="180px"
            size="sm"
            borderRadius="lg"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            fontSize="sm"
          />
        </Flex>
        <Box p={5} pt={4}>
          <DataTable<AttendanceRecord>
            columns={columns}
            data={recentAttendance}
            keyField="id"
          />
        </Box>
      </SectionCard>
    </Box>
  );
}
