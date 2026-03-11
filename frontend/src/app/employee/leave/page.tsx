"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
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
  Select,
  Input,
  HStack,
} from "@chakra-ui/react";
import {
  CalendarOff,
  Calendar,
  Clock,
  Shield,
  Briefcase,
  AlertTriangle,
  Plus,
  Send,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  leaveApi,
  type LeaveSummary,
  type LeaveRequestRecord,
  type LeaveType,
  type RequestMode,
  type HalfDaySession,
  type LeaveStatusType,
} from "@/api/leave.api";

const STATUS_COLORS: Record<LeaveStatusType, { bg: string; color: string }> = {
  PENDING: { bg: "#FFF8E1", color: "#B7791F" },
  APPROVED: { bg: "#E6F9F0", color: "#0D7C47" },
  REJECTED: { bg: "#FEE7E7", color: "#C41E3A" },
  CANCELLED: { bg: "#F5F7FB", color: "#6B7A99" },
};

export default function EmployeeLeavePage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [history, setHistory] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply form
  const [formLeaveType, setFormLeaveType] = useState<LeaveType>("CL");
  const [formMode, setFormMode] = useState<RequestMode>("FULL_DAY");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formSession, setFormSession] = useState<HalfDaySession>("FN");
  const [formFromTime, setFormFromTime] = useState("");
  const [formToTime, setFormToTime] = useState("");
  const [formReason, setFormReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        leaveApi.getMySummary(),
        leaveApi.getMyHistory(),
      ]);
      setSummary(s);
      setHistory(h);
    } catch {
      toast({ title: "Failed to load leave data", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormLeaveType("CL");
    setFormMode("FULL_DAY");
    setFormStartDate("");
    setFormEndDate("");
    setFormDate("");
    setFormSession("FN");
    setFormFromTime("");
    setFormToTime("");
    setFormReason("");
  };

  const handleApply = async () => {
    if (!formReason.trim()) {
      toast({ title: "Please provide a reason", status: "warning", duration: 2000, isClosable: true, position: "top-right" });
      return;
    }
    setSubmitting(true);
    try {
      await leaveApi.applyLeave({
        leaveType: formLeaveType,
        requestMode: formMode,
        startDate: formMode === "FULL_DAY" ? formStartDate : undefined,
        endDate: formMode === "FULL_DAY" ? formEndDate : undefined,
        date: formMode !== "FULL_DAY" ? formDate : undefined,
        halfDaySession: formMode === "HALF_DAY" ? formSession : undefined,
        fromTime: formMode === "PERMISSION" ? formFromTime : undefined,
        toTime: formMode === "PERMISSION" ? formToTime : undefined,
        reason: formReason,
      });
      toast({ title: "Leave request submitted", status: "success", duration: 3000, isClosable: true, position: "top-right" });
      onClose();
      resetForm();
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      toast({
        title: "Failed to submit leave request",
        description: err?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveApi.cancelLeave(id);
      toast({ title: "Leave request cancelled", status: "success", duration: 2000, isClosable: true, position: "top-right" });
      await fetchData();
    } catch (err: any) {
      toast({ title: err?.message || "Failed to cancel", status: "error", duration: 3000, isClosable: true, position: "top-right" });
    }
  };

  // Auto-calculate preview
  const previewDays =
    formMode === "FULL_DAY" && formStartDate && formEndDate
      ? Math.max(0, Math.ceil((new Date(formEndDate).getTime() - new Date(formStartDate).getTime()) / 86400000) + 1)
      : formMode === "HALF_DAY"
        ? 0.5
        : null;

  const previewHours =
    formMode === "PERMISSION" && formFromTime && formToTime
      ? (() => {
          const [fh, fm] = formFromTime.split(":").map(Number);
          const [th, tm] = formToTime.split(":").map(Number);
          return Math.max(0, ((th * 60 + tm) - (fh * 60 + fm)) / 60);
        })()
      : null;

  if (loading) {
    return (
      <Box>
        <PageHeader title="Leave" subtitle="Manage your leave requests" />
        <Flex justify="center" py={20}><Spinner size="lg" color="brand.400" /></Flex>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Leave"
        subtitle="Manage your leave requests"
        actions={
          <Button
            size="sm"
            bgGradient="linear(to-r, brand.400, brand.700)"
            color="white"
            _hover={{ bgGradient: "linear(to-r, brand.500, brand.800)" }}
            borderRadius="lg"
            leftIcon={<Plus size={16} />}
            onClick={() => { resetForm(); onOpen(); }}
          >
            Apply Leave
          </Button>
        }
      />

      {/* Probation Warning */}
      {summary?.inProbation && !summary?.probationLeaveAllowed && (
        <Alert status="warning" borderRadius="xl" mb={6} variant="subtle">
          <AlertIcon />
          <Box>
            <Text fontSize="sm" fontWeight="600">You are currently in probation period</Text>
            <Text fontSize="xs" color="yellow.800">
              Paid leave is not available during probation. Any leave during this period will be treated as Loss of Pay unless approved otherwise.
              {summary.probationEndsOn && ` Probation ends on ${new Date(summary.probationEndsOn + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`}
            </Text>
          </Box>
        </Alert>
      )}

      {/* Balance Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
        <BalanceCard label="Casual Leave" used={summary?.used.cl ?? 0} total={summary?.entitlement.cl ?? 0} balance={summary?.balance.cl ?? 0} color="#7548b9" />
        <BalanceCard label="Sick Leave" used={summary?.used.sl ?? 0} total={summary?.entitlement.sl ?? 0} balance={summary?.balance.sl ?? 0} color="#0D7C47" />
        <BalanceCard label="Earned Leave" used={summary?.used.el ?? 0} total={summary?.entitlement.el ?? 0} balance={summary?.balance.el ?? 0} color="#B7791F" />
        <Box bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="surface.border" shadow="card">
          <Flex align="center" gap={2} mb={2} color="#C41E3A">
            <CalendarOff size={16} />
            <Text fontSize="xs" fontWeight="600" textTransform="uppercase" color="text.muted">LOP Taken</Text>
          </Flex>
          <Text fontSize="xl" fontWeight="700" color="text.heading">{summary?.used.lop ?? 0}</Text>
          <Text fontSize="xs" color="text.muted">days</Text>
        </Box>
        <Box bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="surface.border" shadow="card">
          <Flex align="center" gap={2} mb={2} color="#7A6DAF">
            <Clock size={16} />
            <Text fontSize="xs" fontWeight="600" textTransform="uppercase" color="text.muted">Permission</Text>
          </Flex>
          <Text fontSize="xl" fontWeight="700" color="text.heading">
            {(summary?.permissionHoursUsedThisMonth ?? 0).toFixed(1)}
          </Text>
          <Text fontSize="xs" color="text.muted">
            of {summary?.maxPermissionHoursPerMonth ?? 0}h this month
          </Text>
        </Box>
      </SimpleGrid>

      {/* Status & Policy cards */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={6}>
        <SectionCard title="Employment Status">
          <Flex direction="column" gap={3}>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Briefcase size={16} color="#7548b9" />
                <Text fontSize="sm" color="text.muted">Joining Date</Text>
              </Flex>
              <Text fontSize="sm" fontWeight="600" color="text.heading">
                {summary?.dateOfJoining
                  ? new Date(summary.dateOfJoining + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Shield size={16} color="#7548b9" />
                <Text fontSize="sm" color="text.muted">Status</Text>
              </Flex>
              <Badge
                px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="600"
                bg={summary?.inProbation ? "#FFF8E1" : "#E6F9F0"}
                color={summary?.inProbation ? "#B7791F" : "#0D7C47"}
              >
                {summary?.inProbation ? "In Probation" : "Permanent Employee"}
              </Badge>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="text.muted">Years of Service</Text>
              <Text fontSize="sm" fontWeight="600" color="text.heading">
                {summary?.yearsOfService ?? 0} year(s), {(summary?.monthsOfService ?? 0) % 12} month(s)
              </Text>
            </Flex>
          </Flex>
        </SectionCard>

        <SectionCard title="Your Leave Entitlement">
          {summary?.currentSlab ? (
            <Flex direction="column" gap={2}>
              <Text fontSize="xs" color="text.muted" mb={1}>
                Service year slab: {summary.currentSlab.minYears}–{summary.currentSlab.maxYears ?? "∞"} years
              </Text>
              <SimpleGrid columns={3} spacing={3}>
                <Box bg="#EDE9F5" p={3} borderRadius="lg" textAlign="center">
                  <Text fontSize="xs" color="text.muted">CL</Text>
                  <Text fontSize="lg" fontWeight="700" color="brand.600">{summary.currentSlab.cl}</Text>
                </Box>
                <Box bg="#F0F9F4" p={3} borderRadius="lg" textAlign="center">
                  <Text fontSize="xs" color="text.muted">SL</Text>
                  <Text fontSize="lg" fontWeight="700" color="green.600">{summary.currentSlab.sl}</Text>
                </Box>
                <Box bg="#FFF8E1" p={3} borderRadius="lg" textAlign="center">
                  <Text fontSize="xs" color="text.muted">EL</Text>
                  <Text fontSize="lg" fontWeight="700" color="yellow.700">{summary.currentSlab.el}</Text>
                </Box>
              </SimpleGrid>
              <HStack spacing={3} mt={2}>
                <Badge variant="subtle" colorScheme={summary.allowHalfDayLeave ? "green" : "red"} fontSize="xs">
                  Half Day: {summary.allowHalfDayLeave ? "Allowed" : "Not Allowed"}
                </Badge>
                <Badge variant="subtle" colorScheme={summary.allowPermissionHours ? "green" : "red"} fontSize="xs">
                  Permission: {summary.allowPermissionHours ? "Allowed" : "Not Allowed"}
                </Badge>
              </HStack>
            </Flex>
          ) : (
            <Flex direction="column" align="center" py={6}>
              <AlertTriangle size={24} color="#B7791F" />
              <Text fontSize="sm" color="text.muted" mt={2}>Leave policy not configured yet</Text>
            </Flex>
          )}
        </SectionCard>
      </SimpleGrid>

      {/* Leave History */}
      <SectionCard title="Leave History">
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Applied</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Type</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Mode</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Date / Range</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Days/Hrs</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Status</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Reason</Th>
                <Th fontSize="xs" color="text.muted" fontWeight="600" textTransform="uppercase" borderColor="surface.border">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {history.length === 0 ? (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={8}>
                    <Text color="text.muted" fontSize="sm">No leave requests yet</Text>
                  </Td>
                </Tr>
              ) : (
                history.map((rec) => {
                  const sc = STATUS_COLORS[rec.status];
                  return (
                    <Tr key={rec.id} _hover={{ bg: "surface.bg" }}>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {new Date(rec.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Td>
                      <Td borderColor="surface.border">
                        <Badge px={2} py={0.5} borderRadius="full" bg="#EDE9F5" color="#7548b9" fontSize="xs" fontWeight="600">
                          {rec.leaveType}
                        </Badge>
                      </Td>
                      <Td fontSize="xs" color="text.body" borderColor="surface.border">
                        {rec.requestMode.replace("_", " ")}
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {formatDateRange(rec)}
                      </Td>
                      <Td fontSize="sm" color="text.body" borderColor="surface.border">
                        {rec.totalHours ? `${rec.totalHours}h` : rec.totalDays ? `${rec.totalDays}d` : "—"}
                      </Td>
                      <Td borderColor="surface.border">
                        <Badge px={2} py={0.5} borderRadius="full" bg={sc.bg} color={sc.color} fontSize="xs" fontWeight="600">
                          {rec.status}
                        </Badge>
                      </Td>
                      <Td fontSize="xs" color="text.muted" borderColor="surface.border" maxW="180px">
                        <Text noOfLines={2}>{rec.reason}</Text>
                        {rec.adminRemarks && (
                          <Text fontSize="xs" color="blue.600" mt={0.5} noOfLines={1}>
                            Admin: {rec.adminRemarks}
                          </Text>
                        )}
                      </Td>
                      <Td borderColor="surface.border">
                        {rec.status === "PENDING" && (
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleCancel(rec.id)}>
                            Cancel
                          </Button>
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

      {/* Apply Leave Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottom="1px solid" borderColor="surface.border" fontSize="md" fontWeight="700">
            <Flex align="center" gap={2}>
              <Send size={18} color="#7548b9" />
              Apply Leave
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <Flex direction="column" gap={4}>
              {/* Leave Type */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Leave Type</Text>
                <Select
                  size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                  value={formLeaveType}
                  onChange={(e) => setFormLeaveType(e.target.value as LeaveType)}
                >
                  {formMode !== "PERMISSION" && (
                    <>
                      <option value="CL">Casual Leave (CL)</option>
                      <option value="SL">Sick Leave (SL)</option>
                      <option value="EL">Earned Leave (EL)</option>
                      <option value="LOP">Loss of Pay (LOP)</option>
                    </>
                  )}
                  {formMode === "PERMISSION" && <option value="PERMISSION">Permission</option>}
                </Select>
                {summary && formLeaveType !== "LOP" && formLeaveType !== "PERMISSION" && (
                  <Text fontSize="xs" color="text.muted" mt={1}>
                    Balance: {summary.balance[formLeaveType.toLowerCase() as "cl" | "sl" | "el"]} of {summary.entitlement[formLeaveType.toLowerCase() as "cl" | "sl" | "el"]}
                  </Text>
                )}
              </Box>

              {/* Request Mode */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Request Mode</Text>
                <HStack spacing={2}>
                  {(["FULL_DAY", "HALF_DAY", "PERMISSION"] as RequestMode[]).map((mode) => {
                    const disabled =
                      (mode === "HALF_DAY" && !summary?.allowHalfDayLeave) ||
                      (mode === "PERMISSION" && !summary?.allowPermissionHours);
                    return (
                      <Button
                        key={mode}
                        size="sm"
                        variant={formMode === mode ? "solid" : "outline"}
                        colorScheme={formMode === mode ? "brand" : "gray"}
                        borderRadius="lg"
                        fontSize="xs"
                        isDisabled={disabled}
                        onClick={() => {
                          setFormMode(mode);
                          if (mode === "PERMISSION") setFormLeaveType("PERMISSION");
                          else if (formLeaveType === "PERMISSION") setFormLeaveType("CL");
                        }}
                      >
                        {mode.replace("_", " ")}
                      </Button>
                    );
                  })}
                </HStack>
              </Box>

              {/* Date fields based on mode */}
              {formMode === "FULL_DAY" && (
                <SimpleGrid columns={2} spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Start Date</Text>
                    <Input
                      type="date" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>End Date</Text>
                    <Input
                      type="date" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                      value={formEndDate}
                      min={formStartDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </Box>
                </SimpleGrid>
              )}

              {formMode === "HALF_DAY" && (
                <SimpleGrid columns={2} spacing={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Date</Text>
                    <Input
                      type="date" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Session</Text>
                    <Select
                      size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                      value={formSession}
                      onChange={(e) => setFormSession(e.target.value as HalfDaySession)}
                    >
                      <option value="FN">Forenoon (FN)</option>
                      <option value="AN">Afternoon (AN)</option>
                    </Select>
                  </Box>
                </SimpleGrid>
              )}

              {formMode === "PERMISSION" && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Date</Text>
                    <Input
                      type="date" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </Box>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>From Time</Text>
                      <Input
                        type="time" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                        value={formFromTime}
                        onChange={(e) => setFormFromTime(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>To Time</Text>
                      <Input
                        type="time" size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                        value={formToTime}
                        onChange={(e) => setFormToTime(e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>
                </>
              )}

              {/* Preview */}
              {(previewDays != null || previewHours != null) && (
                <Box bg="#EDE9F5" borderRadius="lg" p={3}>
                  <Text fontSize="sm" fontWeight="600" color="brand.600">
                    {previewDays != null ? `${previewDays} day(s)` : `${previewHours?.toFixed(1)} hour(s)`}
                  </Text>
                </Box>
              )}

              {/* Reason */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="text.heading" mb={1}>Reason</Text>
                <Textarea
                  size="sm" borderRadius="lg" bg="surface.bg" border="1px solid" borderColor="surface.border" fontSize="sm"
                  rows={3}
                  placeholder="Briefly describe the reason for leave..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  maxLength={1000}
                />
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="surface.border" gap={2}>
            <Button size="sm" variant="ghost" onClick={onClose} borderRadius="lg">
              Cancel
            </Button>
            <Button
              size="sm"
              bgGradient="linear(to-r, brand.400, brand.700)"
              color="white"
              _hover={{ bgGradient: "linear(to-r, brand.500, brand.800)" }}
              borderRadius="lg"
              leftIcon={<Send size={14} />}
              isLoading={submitting}
              onClick={handleApply}
            >
              Submit Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// ── Helper Components ──

function BalanceCard({ label, used, total, balance, color }: {
  label: string; used: number; total: number; balance: number; color: string;
}) {
  return (
    <Box bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="surface.border" shadow="card">
      <Flex align="center" gap={2} mb={2}>
        <Calendar size={16} color={color} />
        <Text fontSize="xs" fontWeight="600" textTransform="uppercase" color="text.muted">{label}</Text>
      </Flex>
      <Text fontSize="xl" fontWeight="700" color="text.heading">{balance}</Text>
      <Text fontSize="xs" color="text.muted">
        {used} used of {total}
      </Text>
    </Box>
  );
}

function formatDateRange(rec: LeaveRequestRecord): string {
  if (rec.requestMode === "FULL_DAY") {
    if (rec.startDate === rec.endDate) {
      return rec.startDate
        ? new Date(rec.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "—";
    }
    const s = rec.startDate ? new Date(rec.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const e = rec.endDate ? new Date(rec.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    return `${s} – ${e}`;
  }
  if (rec.requestMode === "HALF_DAY") {
    const d = rec.date ? new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
    return `${d} (${rec.halfDaySession})`;
  }
  const d = rec.date ? new Date(rec.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  return `${d} ${rec.fromTime?.slice(0, 5) ?? ""}–${rec.toTime?.slice(0, 5) ?? ""}`;
}
