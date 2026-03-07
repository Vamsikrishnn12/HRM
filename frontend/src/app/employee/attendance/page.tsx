"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
} from "@chakra-ui/react";
import { CalendarCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  attendanceApi,
  type AttendanceRecord,
  type AttendanceStatusType,
} from "@/api/attendance.api";

const STATUS_COLORS: Record<AttendanceStatusType, { bg: string; color: string }> = {
  PRESENT: { bg: "#E6F9F0", color: "#0D7C47" },
  LATE: { bg: "#FFF8E1", color: "#B7791F" },
  ABSENT: { bg: "#FEE7E7", color: "#C41E3A" },
  HALF_DAY: { bg: "#FFF8E1", color: "#B7791F" },
  LEAVE: { bg: "#E8EAF6", color: "#3949AB" },
  HOLIDAY: { bg: "#E8F5E9", color: "#2E7D32" },
  WEEK_OFF: { bg: "#F3E5F5", color: "#7B1FA2" },
  NOT_STARTED: { bg: "#F8F8FC", color: "#516079" },
  MISSED_CHECK_IN: { bg: "#FEE7E7", color: "#C41E3A" },
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function EmployeeAttendancePage() {
  const toast = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await attendanceApi.getMyHistory(30);
      setRecords(data);
    } catch {
      toast({
        title: "Failed to load attendance history",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="lg" color="brand.400" />
      </Flex>
    );
  }

  // Calculate summary
  const summary = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle="Your attendance history for the last 30 days"
      />

      {/* Summary */}
      <Flex gap={3} mb={6} flexWrap="wrap">
        {(["PRESENT", "LATE", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "WEEK_OFF"] as AttendanceStatusType[]).map(
          (status) => {
            const sc = STATUS_COLORS[status];
            return (
              <Box
                key={status}
                bg="white"
                borderRadius="xl"
                px={4}
                py={3}
                border="1px solid"
                borderColor="surface.border"
                shadow="card"
                minW="120px"
              >
                <Text fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" mb={1}>
                  {status.replace("_", " ")}
                </Text>
                <Badge
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg={sc.bg}
                  color={sc.color}
                  fontSize="md"
                  fontWeight="700"
                >
                  {summary[status] || 0}
                </Badge>
              </Box>
            );
          },
        )}
      </Flex>

      <SectionCard noPadding>
        <Flex gap={3} p={5} pb={0} align="center">
          <CalendarCheck size={16} color="#516079" />
          <Text fontSize="sm" color="text.muted" fontWeight="500">
            Attendance Records
          </Text>
        </Flex>
        <Box p={5} pt={4} overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Date</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Status</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Check-in</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Check-out</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Total Hours</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Late</Th>
              </Tr>
            </Thead>
            <Tbody>
              {records.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    <Text color="text.muted" fontSize="sm">No attendance records found</Text>
                  </Td>
                </Tr>
              ) : (
                records.map((rec) => {
                  const sc = STATUS_COLORS[rec.status];
                  return (
                    <Tr key={rec.id} _hover={{ bg: "surface.bg" }}>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Td>
                      <Td borderColor="surface.border">
                        <Badge
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg={sc.bg}
                          color={sc.color}
                          fontSize="xs"
                          fontWeight="600"
                        >
                          {rec.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {formatTime(rec.firstCheckInAt)}
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {formatTime(rec.lastCheckOutAt)}
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {formatMinutes(rec.totalWorkMinutes)}
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {rec.lateMinutes > 0 ? (
                          <Badge px={2} py={0.5} borderRadius="full" bg="#FEE7E7" color="#C41E3A" fontSize="xs">
                            {rec.lateMinutes} min
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>
    </Box>
  );
}
