"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { Calendar, Search, MoreVertical, CheckCircle, XCircle, Clock, MapPin, RotateCcw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  attendanceApi,
  type AdminAttendanceRecord,
  type AdminAttendanceResponse,
  type AttendanceStatusType,
} from "@/api/attendance.api";

const STATUS_COLORS: Record<AttendanceStatusType, { bg: string; color: string }> = {
  PRESENT: { bg: "#E6F9F0", color: "#0D7C47" },
  LATE: { bg: "#FEF9EC", color: "#92640D" },
  ABSENT: { bg: "#FEF0F0", color: "#C41E3A" },
  HALF_DAY: { bg: "#FEF9EC", color: "#92640D" },
  LEAVE: { bg: "#E1E7F5", color: "#4C5CB2" },
  HOLIDAY: { bg: "#E6F9F0", color: "#0D7C47" },
  WEEK_OFF: { bg: "#F4F2FA", color: "#5C5190" },
  NOT_STARTED: { bg: "#F5F7FB", color: "#6B7A99" },
  MISSED_CHECK_IN: { bg: "#FEF0F0", color: "#C41E3A" },
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

export default function AdminAttendancePage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Override modal state
  const [selectedRecord, setSelectedRecord] = useState<AdminAttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Manual entry modal
  const {
    isOpen: isManualOpen,
    onOpen: onManualOpen,
    onClose: onManualClose,
  } = useDisclosure();
  const [manualCheckIn, setManualCheckIn] = useState("");
  const [manualCheckOut, setManualCheckOut] = useState("");
  const [manualStatus, setManualStatus] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [reEnableLoading, setReEnableLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await attendanceApi.getAdminAttendance(date, statusFilter || undefined, search || undefined);
      setData(result);
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
  }, [date, statusFilter, search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOverride = async () => {
    if (!selectedRecord || !overrideStatus || !overrideReason) return;
    setOverrideLoading(true);
    try {
      await attendanceApi.overrideStatus(selectedRecord.employeeId, {
        date,
        status: overrideStatus,
        reason: overrideReason,
      });
      toast({
        title: "Status overridden successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      onClose();
      setOverrideStatus("");
      setOverrideReason("");
      setSelectedRecord(null);
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Failed to override status",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!selectedRecord) return;
    setManualLoading(true);
    try {
      const payload: { date: string; firstCheckInAt?: string; lastCheckOutAt?: string; status?: string; reason?: string } = { date };
      if (manualCheckIn) payload.firstCheckInAt = new Date(`${date}T${manualCheckIn}`).toISOString();
      if (manualCheckOut) payload.lastCheckOutAt = new Date(`${date}T${manualCheckOut}`).toISOString();
      if (manualStatus) payload.status = manualStatus;
      if (manualReason) payload.reason = manualReason;

      await attendanceApi.manualEntry(selectedRecord.employeeId, payload);
      toast({
        title: "Manual entry saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      onManualClose();
      setManualCheckIn("");
      setManualCheckOut("");
      setManualStatus("");
      setManualReason("");
      setSelectedRecord(null);
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Failed to save manual entry",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setManualLoading(false);
    }
  };

  const openOverrideModal = (record: AdminAttendanceRecord) => {
    setSelectedRecord(record);
    setOverrideStatus("");
    setOverrideReason("");
    onOpen();
  };

  const openManualModal = (record: AdminAttendanceRecord) => {
    setSelectedRecord(record);
    setManualCheckIn("");
    setManualCheckOut("");
    setManualStatus("");
    setManualReason("");
    onManualOpen();
  };

  const handleReEnableStartWork = async (record: AdminAttendanceRecord) => {
    setReEnableLoading(true);
    try {
      await attendanceApi.reEnableStartWork(record.employeeId);
      toast({
        title: "Start work re-enabled",
        description: `${record.employeeName} can now start work`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Failed to re-enable start work",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setReEnableLoading(false);
    }
  };

  const summary = data?.summary ?? {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
    HALF_DAY: 0,
    LEAVE: 0,
    HOLIDAY: 0,
    WEEK_OFF: 0,
    NOT_STARTED: 0,
    MISSED_CHECK_IN: 0,
  };

  return (
    <Box>
      <PageHeader
        title="Attendance Management"
        subtitle="Track and manage employee attendance records"
      />

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 9 }} spacing={3} mb={6}>
        {(
          [
            { key: "PRESENT", label: "Present", icon: <CheckCircle size={16} /> },
            { key: "LATE", label: "Late", icon: <Clock size={16} /> },
            { key: "ABSENT", label: "Absent", icon: <XCircle size={16} /> },
            { key: "HALF_DAY", label: "Half Day", icon: <Clock size={16} /> },
            { key: "LEAVE", label: "Leave", icon: <Calendar size={16} /> },
            { key: "HOLIDAY", label: "Holiday", icon: <Calendar size={16} /> },
            { key: "WEEK_OFF", label: "Week Off", icon: <Calendar size={16} /> },
            { key: "NOT_STARTED", label: "Not Started", icon: <Clock size={16} /> },
            { key: "MISSED_CHECK_IN", label: "Missed", icon: <XCircle size={16} /> },
          ] as const
        ).map(({ key, label, icon }) => {
          const sc = STATUS_COLORS[key];
          return (
            <Box
              key={key}
              bg="white"
              borderRadius="xl"
              p={4}
              border="1px solid"
              borderColor="surface.border"
              shadow="card"
            >
              <Flex align="center" gap={1.5} mb={1} color={sc.color}>
                {icon}
                <Text fontSize="xs" fontWeight="600" textTransform="uppercase">
                  {label}
                </Text>
              </Flex>
              <Text fontSize="xl" fontWeight="700" color="text.heading">
                {summary[key] ?? 0}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Filters */}
      <SectionCard noPadding mb={6}>
        <Flex gap={3} p={5} align="center" flexWrap="wrap">
          <Flex align="center" gap={2}>
            <Calendar size={16} color="#6B7A99" />
            <Text fontSize="sm" color="text.muted" fontWeight="500">
              Date:
            </Text>
          </Flex>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            maxW="180px"
            size="sm"
            borderRadius="lg"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            fontSize="sm"
          />

          <Select
            size="sm"
            maxW="160px"
            borderRadius="lg"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            fontSize="sm"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="LEAVE">Leave</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="WEEK_OFF">Week Off</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="MISSED_CHECK_IN">Missed Check-in</option>
          </Select>

          <InputGroup maxW="250px" size="sm">
            <InputLeftElement pointerEvents="none">
              <Search size={14} color="#6B7A99" />
            </InputLeftElement>
            <Input
              placeholder="Search employee..."
              borderRadius="lg"
              bg="surface.bg"
              border="1px solid"
              borderColor="surface.border"
              fontSize="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Flex>

        {/* Table */}
        <Box p={5} pt={0} overflowX="auto">
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" color="brand.400" />
            </Flex>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Employee</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="80px">Code</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="90px">Check-in</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="90px">Check-out</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="80px">Hours</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="90px">Status</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="70px">Late</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="150px">EOD Note</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="50px">Loc.</Th>
                  <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border" width="50px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(data?.records ?? []).length === 0 ? (
                  <Tr>
                    <Td colSpan={10} textAlign="center" py={8}>
                      <Text color="text.muted" fontSize="sm">No attendance records found for this date</Text>
                    </Td>
                  </Tr>
                ) : (
                  (data?.records ?? []).map((rec) => {
                    const sc = STATUS_COLORS[rec.status] ?? { bg: "#F5F7FB", color: "#6B7A99" };
                    return (
                      <Tr key={rec.employeeId} _hover={{ bg: "surface.bg" }}>
                        <Td borderColor="surface.border">
                          <Text fontWeight="600" color="text.heading" fontSize="sm">
                            {rec.employeeName ?? "—"}
                          </Text>
                        </Td>
                        <Td fontSize="sm" color="text.body" borderColor="surface.border">
                          {rec.employeeCode ?? "—"}
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
                          {rec.isManualOverride && (
                            <Text fontSize="9px" color="text.muted" mt={0.5}>
                              Overridden
                            </Text>
                          )}
                          {rec.overrideActive && (
                            <Badge px={1.5} py={0.5} borderRadius="full" bg="#E8EAF6" color="#3949AB" fontSize="9px" mt={0.5}>
                              Override Active
                            </Badge>
                          )}
                        </Td>
                        <Td fontSize="sm" color="text.body" borderColor="surface.border">
                          {rec.lateMinutes > 0 ? (
                            <Badge px={2} py={0.5} borderRadius="full" bg="#FEE7E7" color="#C41E3A" fontSize="xs">
                              {rec.lateMinutes}m
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td fontSize="sm" color="text.body" borderColor="surface.border">
                          <Text fontSize="xs" color="text.muted" noOfLines={2} title={rec.eodDescription ?? ""}>
                            {rec.eodDescription || "—"}
                          </Text>
                        </Td>
                        <Td borderColor="surface.border" textAlign="center">
                          {rec.locationValidated ? (
                            <MapPin size={14} color="#0D7C47" />
                          ) : (
                            <Text fontSize="xs" color="text.muted">—</Text>
                          )}
                        </Td>
                        <Td borderColor="surface.border">
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreVertical size={14} />}
                              variant="ghost"
                              size="xs"
                              color="text.muted"
                            />
                            <MenuList minW="180px" borderRadius="xl" shadow="lg" border="1px solid" borderColor="surface.border" py={1}>
                              <MenuItem fontSize="sm" onClick={() => { setSelectedRecord(rec); setOverrideStatus("PRESENT"); setOverrideReason(""); onOpen(); }}>
                                Mark Present
                              </MenuItem>
                              <MenuItem fontSize="sm" onClick={() => { setSelectedRecord(rec); setOverrideStatus("LEAVE"); setOverrideReason(""); onOpen(); }}>
                                Mark Leave
                              </MenuItem>
                              <MenuItem fontSize="sm" onClick={() => { setSelectedRecord(rec); setOverrideStatus("HALF_DAY"); setOverrideReason(""); onOpen(); }}>
                                Mark Half Day
                              </MenuItem>
                              <MenuItem fontSize="sm" onClick={() => { setSelectedRecord(rec); setOverrideStatus("ABSENT"); setOverrideReason(""); onOpen(); }}>
                                Mark Absent
                              </MenuItem>
                              <MenuItem fontSize="sm" onClick={() => openManualModal(rec)}>
                                Manual Entry
                              </MenuItem>
                              <MenuItem fontSize="sm" onClick={() => openOverrideModal(rec)}>
                                Override with Reason
                              </MenuItem>
                              {(rec.status === "MISSED_CHECK_IN" || rec.status === "NOT_STARTED") && !rec.overrideActive && (
                                <MenuItem
                                  fontSize="sm"
                                  icon={<RotateCcw size={14} />}
                                  isDisabled={reEnableLoading}
                                  onClick={() => handleReEnableStartWork(rec)}
                                >
                                  Re-enable Start Work
                                </MenuItem>
                              )}
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          )}
        </Box>
      </SectionCard>

      {/* Override Status Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="600">
            Override Attendance Status
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.muted" mb={4}>
              {selectedRecord?.employeeName} &mdash; {date}
            </Text>
            <FormControl mb={4}>
              <FormLabel fontSize="sm" fontWeight="500">Status</FormLabel>
              <Select
                size="sm"
                borderRadius="lg"
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
              >
                <option value="">Select status</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">Leave</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="MISSED_CHECK_IN">Missed Check-in</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">Reason</FormLabel>
              <Textarea
                size="sm"
                borderRadius="lg"
                rows={3}
                placeholder="Provide a reason for override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              bg="brand.400"
              color="white"
              _hover={{ bg: "brand.500" }}
              isLoading={overrideLoading}
              isDisabled={!overrideStatus || !overrideReason}
              onClick={handleOverride}
            >
              Save Override
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal isOpen={isManualOpen} onClose={onManualClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md" fontWeight="600">
            Manual Attendance Entry
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="text.muted" mb={4}>
              {selectedRecord?.employeeName} &mdash; {date}
            </Text>
            <SimpleGrid columns={2} spacing={3} mb={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500">Check-in Time</FormLabel>
                <Input
                  type="time"
                  size="sm"
                  borderRadius="lg"
                  value={manualCheckIn}
                  onChange={(e) => setManualCheckIn(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="500">Check-out Time</FormLabel>
                <Input
                  type="time"
                  size="sm"
                  borderRadius="lg"
                  value={manualCheckOut}
                  onChange={(e) => setManualCheckOut(e.target.value)}
                />
              </FormControl>
            </SimpleGrid>
            <FormControl mb={4}>
              <FormLabel fontSize="sm" fontWeight="500">Status</FormLabel>
              <Select
                size="sm"
                borderRadius="lg"
                placeholder="Select status (optional)"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">Leave</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">Reason</FormLabel>
              <Textarea
                size="sm"
                borderRadius="lg"
                rows={3}
                placeholder="Reason for manual entry..."
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button size="sm" variant="ghost" onClick={onManualClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              bg="brand.400"
              color="white"
              _hover={{ bg: "brand.500" }}
              isLoading={manualLoading}
              onClick={handleManualEntry}
            >
              Save Entry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
