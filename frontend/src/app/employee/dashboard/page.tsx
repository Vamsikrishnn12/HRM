"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { CalendarCheck, Clock3, LogIn, LogOut, MapPin, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SectionCard from "@/components/ui/SectionCard";
import UpcomingBirthdaysWidget from "@/components/ui/UpcomingBirthdaysWidget";
import UpcomingHolidaysWidget from "@/components/ui/UpcomingHolidaysWidget";
import PunchCameraModal from "@/components/attendance/PunchCameraModal";
import {
  attendanceApi,
  type AttendanceRecord,
  type AttendanceStatusType,
  type TodayAttendanceResponse,
} from "@/api/attendance.api";

const STATUS_COLORS: Record<AttendanceStatusType, { bg: string; color: string; label: string }> = {
  PRESENT: { bg: "#E6F9F0", color: "#0D7C47", label: "Present" },
  LATE: { bg: "#FFF8E1", color: "#B7791F", label: "Late" },
  ABSENT: { bg: "#FEE7E7", color: "#C41E3A", label: "Absent" },
  HALF_DAY: { bg: "#FFF8E1", color: "#B7791F", label: "Half Day" },
  LEAVE: { bg: "#E8EAF6", color: "#3949AB", label: "Leave" },
  HOLIDAY: { bg: "#E8F5E9", color: "#2E7D32", label: "Holiday" },
  WEEK_OFF: { bg: "#EDE9F5", color: "#7A6DAF", label: "Week Off" },
  NOT_STARTED: { bg: "#F5F7FB", color: "#6B7A99", label: "Not Started" },
  MISSED_CHECK_IN: { bg: "#FEE7E7", color: "#C41E3A", label: "Missed In" },
  PERMISSION: { bg: "#EAF7FF", color: "#0B68A6", label: "Permission" },
  REGULARIZED: { bg: "#FFF5EB", color: "#A45B1A", label: "Regularized" },
  LOP: { bg: "#FDECEC", color: "#AE1F44", label: "LOP" },
  MISSING_PUNCH: { bg: "#FFF0ED", color: "#C4472A", label: "Missing Punch" },
  EARLY_OUT: { bg: "#FFF3E0", color: "#B36B00", label: "Early Out" },
  OVERTIME: { bg: "#EAFBF5", color: "#0C8A61", label: "Overtime" },
};

function formatTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMinutes(total: number): string {
  if (!total) return "-";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes || totalMinutes <= 0) return "-";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function getCoordinates(): Promise<{ latitude?: number; longitude?: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return {};
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve({}),
      { timeout: 7000, maximumAge: 20000 },
    );
  });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [todayState, setTodayState] = useState<TodayAttendanceResponse | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const punchCamera = useDisclosure();

  const fetchData = useCallback(async () => {
    try {
      const [today, hist] = await Promise.all([
        attendanceApi.getMyState(),
        attendanceApi.getMyHistory(7),
      ]);
      setTodayState(today);
      setHistory(hist);
    } catch {
      toast({
        title: "Failed to load attendance",
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
    fetchData();
  }, [fetchData]);

  const submitPunch = async (photo?: File) => {
    if (!todayState) return;
    setPunchLoading(true);
    try {
      const coords = await getCoordinates();
      const hasLocation = coords.latitude != null && coords.longitude != null;
      await attendanceApi.punchAction({
        punchType: todayState.nextPunchType,
        ...coords,
        remarks: hasLocation ? undefined : "Remote punch from employee dashboard",
        photo,
      });

      toast({
        title: todayState.nextPunchType === "CHECK_IN" ? "Punch in successful" : "Punch out successful",
        status: "success",
        duration: 2200,
        isClosable: true,
        position: "top-right",
      });
      punchCamera.onClose();
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Punch failed",
        description: err?.message || "Unable to complete punch action",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunch = () => {
    if (todayState?.nextPunchType === "CHECK_IN") {
      punchCamera.onOpen();
      return;
    }
    void submitPunch();
  };

  const todayAttendance = todayState?.attendance;
  const todayStatus = todayAttendance?.status ?? "NOT_STARTED";
  const statusStyle = STATUS_COLORS[todayStatus];
  const canPunch = Boolean(todayState?.canPunchToday);
  const nonWorkReason = useMemo(() => {
    if (!todayState) return null;
    if (todayState.reasonCode === "HOLIDAY") return "Holiday";
    if (todayState.reasonCode === "WEEK_OFF") return "Weekly Off";
    if (todayState.reasonCode === "ON_LEAVE") return "On Leave";
    if (todayState.reasonCode === "PRE_JOINING") return "Before Joining";
    return null;
  }, [todayState]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="360px">
        <Spinner size="lg" color="brand.400" />
      </Flex>
    );
  }

  return (
    <Box>
      <PunchCameraModal
        isOpen={punchCamera.isOpen}
        onClose={punchCamera.onClose}
        onConfirm={submitPunch}
        isSubmitting={punchLoading}
      />
      <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={6} direction={{ base: "column", md: "row" }} gap={3}>
        <Box>
          <Heading size="lg" color="text.heading" mb={1}>
            Welcome, {user ? `${user.firstName} ${user.lastName}` : "Employee"}
          </Heading>
          <Text color="text.muted" fontSize="sm">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </Box>
      </Flex>

      <SectionCard mb={6}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          justify="space-between"
          align={{ base: "stretch", lg: "center" }}
          gap={4}
        >
          <Flex direction="column" gap={3}>
            <HStack spacing={2}>
              <CalendarCheck size={17} color="#0B72E7" />
              <Text fontSize="sm" fontWeight="700" color="text.heading">Today Attendance</Text>
              <Badge px={2.5} py={1} borderRadius="full" bg={statusStyle.bg} color={statusStyle.color} fontSize="11px">
                {statusStyle.label}
              </Badge>
            </HStack>

            <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={3}>
              <Metric label="First In" value={formatTime(todayAttendance?.firstCheckInAt ?? null)} />
              <Metric label="Last Out" value={formatTime(todayAttendance?.lastCheckOutAt ?? null)} />
              <Metric label="Active" value={formatMinutes(todayAttendance?.totalWorkMinutes ?? 0)} />
              <Metric label="Break" value={formatMinutes(todayAttendance?.totalBreakMinutes ?? 0)} />
              <Metric label="Late By" value={formatDuration(todayAttendance?.lateMinutes)} />
              <Metric
                label="Next Action"
                value={!todayState ? "-" : todayState.nextPunchType === "CHECK_IN" ? "Punch In" : "Punch Out"}
              />
            </SimpleGrid>

            <HStack spacing={4} color="text.muted" fontSize="xs" flexWrap="wrap">
              <HStack spacing={1}><Clock3 size={13} /><Text>Shift {todayState?.workStartTime} - {todayState?.workEndTime}</Text></HStack>
              <HStack spacing={1}><Timer size={13} /><Text>Grace {todayState?.lateGraceMinutes}m</Text></HStack>
              <HStack spacing={1}><MapPin size={13} /><Text>{todayState?.accessPolicy?.attendanceMode?.replace(/_/g, " ") || "Access policy"}</Text></HStack>
            </HStack>
          </Flex>

          <Flex direction="column" align={{ base: "stretch", lg: "flex-end" }} gap={2}>
            <HStack spacing={2} justify={{ base: "stretch", lg: "flex-end" }} w="full">
              <Button
                leftIcon={todayState?.nextPunchType === "CHECK_IN" ? <LogIn size={15} /> : <LogOut size={15} />}
                bg={todayState?.nextPunchType === "CHECK_IN" ? "brand.500" : "#1D4ED8"}
                color="white"
                _hover={{ opacity: 0.92 }}
                onClick={handlePunch}
                isLoading={punchLoading}
                isDisabled={!canPunch}
                flex={{ base: 1, lg: "unset" }}
              >
                {!todayState ? "Attendance unavailable" : todayState.nextPunchType === "CHECK_IN" ? "Punch In" : "Punch Out"}
              </Button>
              <Button
                variant="outline"
                onClick={fetchData}
                isDisabled={punchLoading}
                flex={{ base: 1, lg: "unset" }}
              >
                Refresh
              </Button>
            </HStack>
            {nonWorkReason && (
              <Text fontSize="xs" color="text.muted" textAlign={{ base: "left", lg: "right" }}>
                {nonWorkReason}: {todayState?.reasonMessage}
              </Text>
            )}
          </Flex>
        </Flex>
      </SectionCard>

      <SectionCard title="Recent Attendance (Last 7 Days)">
        <Box overflowX="auto">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>In</Th>
                <Th>Out</Th>
                <Th>Worked</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={6}>
                    <Text color="text.muted" fontSize="sm">No attendance records yet</Text>
                  </Td>
                </Tr>
              ) : (
                history.map((row) => {
                  const style = STATUS_COLORS[row.status];
                  return (
                    <Tr key={`${row.employeeId}-${row.date}`}>
                      <Td fontSize="sm">
                        {new Date(`${row.date}T00:00:00`).toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Td>
                      <Td>
                        <Badge bg={style.bg} color={style.color} borderRadius="full">{style.label}</Badge>
                      </Td>
                      <Td fontSize="sm">{formatTime(row.firstCheckInAt)}</Td>
                      <Td fontSize="sm">{formatTime(row.lastCheckOutAt)}</Td>
                      <Td fontSize="sm">{formatMinutes(row.totalWorkMinutes)}</Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mt={6}>
        <UpcomingBirthdaysWidget />
        <UpcomingHolidaysWidget />
      </SimpleGrid>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box bg="surface.bg" border="1px solid" borderColor="surface.border" borderRadius="lg" px={3} py={2}>
      <Text fontSize="10px" textTransform="uppercase" color="text.muted" fontWeight="600">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="700" color="text.heading">
        {value}
      </Text>
    </Box>
  );
}
