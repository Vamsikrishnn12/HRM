"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Badge,
  Spinner,
  useToast,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  Clock,
  Play,
  Square,
  CalendarCheck,
  Timer,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SectionCard from "@/components/ui/SectionCard";
import UpcomingBirthdaysWidget from "@/components/ui/UpcomingBirthdaysWidget";
import UpcomingHolidaysWidget from "@/components/ui/UpcomingHolidaysWidget";
import {
  attendanceApi,
  type TodayAttendanceResponse,
  type AttendanceRecord,
  type AttendanceStatusType,
} from "@/api/attendance.api";

const SLOGANS = [
  "Start your day with confidence and consistency.",
  "Every small effort today builds your success tomorrow.",
  "Your dedication makes the difference. Keep going!",
  "Progress is built one day at a time. You're doing great!",
  "Show up, stay focused, and finish strong today.",
];

const STATUS_COLORS: Record<AttendanceStatusType, { bg: string; color: string }> = {
  PRESENT: { bg: "#E6F9F0", color: "#0D7C47" },
  LATE: { bg: "#FFF8E1", color: "#B7791F" },
  ABSENT: { bg: "#FEE7E7", color: "#C41E3A" },
  HALF_DAY: { bg: "#FFF8E1", color: "#B7791F" },
  LEAVE: { bg: "#E8EAF6", color: "#3949AB" },
  HOLIDAY: { bg: "#E8F5E9", color: "#2E7D32" },
  WEEK_OFF: { bg: "#EDE9F5", color: "#7A6DAF" },
  NOT_STARTED: { bg: "#F5F7FB", color: "#6B7A99" },
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

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [todayData, setTodayData] = useState<TodayAttendanceResponse | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [eodDescription, setEodDescription] = useState("");
  const { isOpen: isEodOpen, onOpen: onEodOpen, onClose: onEodClose } = useDisclosure();

  const slogan = useMemo(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)], []);

  const fetchData = useCallback(async () => {
    try {
      const [today, hist] = await Promise.all([
        attendanceApi.getMyToday(),
        attendanceApi.getMyHistory(7),
      ]);
      setTodayData(today);
      setHistory(hist);
    } catch {
      toast({
        title: "Failed to load attendance data",
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

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      let location: { latitude?: number; longitude?: number } = {};

      if (user?.officeLocationRequired && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        );
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      }

      await attendanceApi.startWork(location);
      toast({
        title: "Work started successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Could not start work",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndWork = async () => {
    setActionLoading(true);
    try {
      let location: { latitude?: number; longitude?: number } = {};

      if (user?.officeLocationRequired && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        );
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      }

      await attendanceApi.endWork({ ...location, eodDescription: eodDescription || undefined });
      onEodClose();
      setEodDescription("");
      toast({
        title: "Work ended successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Could not end work",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="lg" color="brand.400" />
      </Flex>
    );
  }

  const att = todayData?.attendance;
  const hasCheckedIn = !!att?.firstCheckInAt;
  const hasCheckedOut = !!att?.lastCheckOutAt;
  const isNonWorkDay = todayData?.dayType === "HOLIDAY" || todayData?.dayType === "WEEK_OFF";
  const reasonCode = todayData?.reasonCode;
  const reasonMessage = todayData?.reasonMessage;

  return (
    <Box>
      {/* Welcome Section */}
      <Flex justify="space-between" align="flex-start" mb={6} direction={{ base: "column", md: "row" }} gap={4}>
        <Box>
          <Heading size="lg" color="text.heading" mb={1}>
            Welcome, {user ? `${user.firstName} ${user.lastName}` : "Employee"}!
          </Heading>
          <Text color="text.muted" fontSize="sm">
            {user?.empId && `${user.empId} • `}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </Box>
      </Flex>

      {/* Motivational Slogan */}
      <SectionCard mb={6}>
        <Flex align="center" gap={3}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bgGradient="linear(to-br, brand.400, brand.700)"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Sparkles size={20} color="white" />
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="600" color="text.heading">
              Thought of the Day
            </Text>
            <Text fontSize="sm" color="text.muted" fontStyle="italic">
              &quot;{slogan}&quot;
            </Text>
          </Box>
        </Flex>
      </SectionCard>

      {/* Attendance Action Card */}
      <SectionCard mb={6}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={4}
        >
          <Box>
            <Flex align="center" gap={2} mb={1}>
              <CalendarCheck size={18} color="#7548b9" />
              <Text fontSize="md" fontWeight="600" color="text.heading">
                Today&apos;s Attendance
              </Text>
            </Flex>
            {isNonWorkDay && (
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg={todayData?.dayType === "HOLIDAY" ? "#E8F5E9" : "#EDE9F5"}
                color={todayData?.dayType === "HOLIDAY" ? "#2E7D32" : "#7A6DAF"}
                fontSize="xs"
                fontWeight="600"
              >
                {todayData?.dayType === "HOLIDAY" ? "Holiday" : "Week Off"}
              </Badge>
            )}
            {!isNonWorkDay && reasonCode === "BEFORE_START_TIME" && (
              <Flex align="center" gap={1.5} mt={1}>
                <AlertCircle size={14} color="#B7791F" />
                <Text fontSize="xs" color="yellow.700">
                  {reasonMessage}
                </Text>
              </Flex>
            )}
            {!isNonWorkDay && reasonCode === "OVERRIDE_ACTIVE" && !hasCheckedIn && (
              <Flex align="center" gap={1.5} mt={1}>
                <AlertCircle size={14} color="#3949AB" />
                <Text fontSize="xs" color="blue.600">
                  {reasonMessage}
                </Text>
              </Flex>
            )}
            {!isNonWorkDay && reasonCode === "ON_LEAVE" && (
              <Badge px={3} py={1} borderRadius="full" bg="#E8EAF6" color="#3949AB" fontSize="xs" fontWeight="600">
                On Leave
              </Badge>
            )}
          </Box>

          {!isNonWorkDay && (
            <Box>
              {reasonCode === "WINDOW_EXPIRED" && !hasCheckedIn ? (
                <Alert status="error" borderRadius="xl" variant="subtle">
                  <AlertIcon />
                  <Text fontSize="sm" fontWeight="500">
                    {reasonMessage || "Check-in window has expired. Please contact your admin for regularization."}
                  </Text>
                </Alert>
              ) : !hasCheckedIn ? (
                <Button
                  size="lg"
                  bgGradient="linear(to-r, brand.400, brand.700)"
                  color="white"
                  _hover={{ bgGradient: "linear(to-r, brand.500, brand.800)", transform: "translateY(-1px)" }}
                  _active={{ transform: "translateY(0)" }}
                  borderRadius="xl"
                  px={8}
                  leftIcon={<Play size={18} />}
                  isLoading={actionLoading}
                  isDisabled={!todayData?.canStartWork}
                  onClick={handleStartWork}
                  shadow="md"
                  transition="all 0.2s"
                >
                  Start Work
                </Button>
              ) : !hasCheckedOut ? (
                <Button
                  size="lg"
                  bg="#C41E3A"
                  color="white"
                  _hover={{ bg: "#A01830", transform: "translateY(-1px)" }}
                  _active={{ transform: "translateY(0)" }}
                  borderRadius="xl"
                  px={8}
                  leftIcon={<Square size={16} />}
                  isLoading={actionLoading}
                  onClick={onEodOpen}
                  shadow="md"
                  transition="all 0.2s"
                >
                  End of Day
                </Button>
              ) : (
                <Badge
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg="#E6F9F0"
                  color="#0D7C47"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Day Completed
                </Badge>
              )}
            </Box>
          )}
        </Flex>
      </SectionCard>

      {/* Attendance Summary Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
        <SummaryCard
          label="Today Status"
          value={
            isNonWorkDay
              ? todayData?.dayType === "HOLIDAY"
                ? "Holiday"
                : "Week Off"
              : todayData?.todayStatus?.replace("_", " ") ?? "Not Marked"
          }
          statusColor={
            todayData?.todayStatus
              ? STATUS_COLORS[todayData.todayStatus as AttendanceStatusType]
              : undefined
          }
          icon={<CalendarCheck size={18} />}
        />
        <SummaryCard
          label="Check-in"
          value={formatTime(att?.firstCheckInAt ?? null)}
          icon={<Play size={18} />}
        />
        <SummaryCard
          label="Check-out"
          value={formatTime(att?.lastCheckOutAt ?? null)}
          icon={<Square size={18} />}
        />
        <SummaryCard
          label="Worked Hours"
          value={formatMinutes(att?.totalWorkMinutes ?? 0)}
          icon={<Timer size={18} />}
        />
        <SummaryCard
          label="Late By"
          value={att?.lateMinutes ? `${att.lateMinutes} min` : "—"}
          statusColor={att?.lateMinutes ? { bg: "#FEE7E7", color: "#C41E3A" } : undefined}
          icon={<Clock size={18} />}
        />
      </SimpleGrid>

      {/* Recent Attendance History */}
      <SectionCard title="Recent Attendance (Last 7 Days)">
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Date</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Status</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Check-in</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Check-out</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Total Hours</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8}>
                    <Text color="text.muted" fontSize="sm">No attendance records yet</Text>
                  </Td>
                </Tr>
              ) : (
                history.map((rec) => {
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
                          bg={sc?.bg ?? "#F5F7FB"}
                          color={sc?.color ?? "#6B7A99"}
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
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>

      {/* Birthdays & Holidays Widgets */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mt={6}>
        <UpcomingBirthdaysWidget />
        <UpcomingHolidaysWidget />
      </SimpleGrid>

      {/* EOD Confirmation Modal */}
      <Modal isOpen={isEodOpen} onClose={onEodClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="lg" fontWeight="600">End of Day Confirmation</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.muted" mb={3}>
              Please provide a brief summary of your work today (optional).
            </Text>
            <Textarea
              placeholder="What did you work on today?"
              value={eodDescription}
              onChange={(e) => setEodDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              borderRadius="lg"
            />
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onEodClose} borderRadius="lg">
              Cancel
            </Button>
            <Button
              bg="#C41E3A"
              color="white"
              _hover={{ bg: "#A01830" }}
              borderRadius="lg"
              isLoading={actionLoading}
              onClick={handleEndWork}
            >
              Confirm &amp; End Day
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  statusColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  statusColor?: { bg: string; color: string };
}) {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      p={4}
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
    >
      <Flex align="center" gap={2} mb={2} color="brand.400">
        {icon}
        <Text fontSize="xs" fontWeight="600" color="text.muted" textTransform="uppercase">
          {label}
        </Text>
      </Flex>
      {statusColor ? (
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          bg={statusColor.bg}
          color={statusColor.color}
          fontSize="sm"
          fontWeight="700"
        >
          {value}
        </Badge>
      ) : (
        <Text fontSize="lg" fontWeight="700" color="text.heading">
          {value}
        </Text>
      )}
    </Box>
  );
}
