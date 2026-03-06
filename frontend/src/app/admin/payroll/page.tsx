"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  SimpleGrid,
  Flex,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  useToast,
  Progress,
  Badge,
  Spinner,
  Input,
} from "@chakra-ui/react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Mail,
  Eye,
  Trash2,
  Plus,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import {
  payrollApi,
  type PayrollComponent,
  type PayrollPreview,
  type PayrollRecordType,
  type PayrollSummary,
  type ImportJobStatusType,
} from "@/api";
import { getAccessToken } from "@/lib/api";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

// ─── Main Page ───
export default function PayrollPage() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [records, setRecords] = useState<PayrollRecordType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        payrollApi.summary(month, year),
        payrollApi.listRecords({ month, year, search: search || undefined }),
      ]);
      setSummary(s);
      setRecords(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Records", value: summary?.totalRecords ?? 0, icon: DollarSign, color: "#8B5CF6", bg: "#F3EEFE" },
      { label: "Generated", value: summary?.generated ?? 0, icon: TrendingUp, color: "#0D7C47", bg: "#E6F9F0" },
      { label: "Emailed", value: summary?.emailed ?? 0, icon: Mail, color: "#2563EB", bg: "#EFF6FF" },
      { label: "Total Payout", value: `₹${(summary?.totalPayout ?? 0).toLocaleString("en-IN")}`, icon: DollarSign, color: "#B25E09", bg: "#FFF4E5" },
    ],
    [summary],
  );

  const columns = useMemo<Column<PayrollRecordType>[]>(
    () => [
      {
        key: "employeeSnapshot",
        header: "Employee",
        render: (row) => (
          <Box>
            <Text fontWeight="600" color="text.heading" fontSize="sm">
              {row.employeeSnapshot?.employeeName || "—"}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {row.employeeSnapshot?.employeeCode || ""} · {row.employeeSnapshot?.department || ""}
            </Text>
          </Box>
        ),
      },
      {
        key: "grossEarnings",
        header: "Gross",
        render: (row) => <Text fontSize="sm">₹{row.grossEarnings.toLocaleString("en-IN")}</Text>,
      },
      {
        key: "totalDeductions",
        header: "Deductions",
        render: (row) => (
          <Text fontSize="sm" color="#C41E3A">
            -₹{row.totalDeductions.toLocaleString("en-IN")}
          </Text>
        ),
      },
      {
        key: "netPay",
        header: "Net Pay",
        render: (row) => (
          <Text fontWeight="700" color="text.heading" fontSize="sm">
            ₹{row.netPay.toLocaleString("en-IN")}
          </Text>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status as any} />,
      },
      {
        key: "actions" as any,
        header: "Actions",
        width: "120px",
        render: (row) => (
          <Flex gap={1}>
            {row.hasPayslip && (
              <IconButton
                aria-label="Download"
                icon={<Download size={14} />}
                size="xs"
                variant="ghost"
                onClick={() => handleDownload(row.id)}
              />
            )}
            {(row.status === "GENERATED" || row.status === "EMAILED") && (
              <IconButton
                aria-label="Email"
                icon={<Mail size={14} />}
                size="xs"
                variant="ghost"
                onClick={() => handleEmail(row.id)}
              />
            )}
          </Flex>
        ),
      },
    ],
    [],
  );

  const handleDownload = (id: string) => {
    const token = getAccessToken();
    const url = payrollApi.downloadPayslipUrl(id);
    const a = document.createElement("a");
    a.href = `${url}?token=${token}`;
    a.target = "_blank";
    a.click();
  };

  const handleEmail = async (id: string) => {
    try {
      await payrollApi.emailPayslip(id);
      toast({ title: "Payslip emailed", status: "success", duration: 2500, isClosable: true });
      fetchData();
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, status: "error", duration: 3500, isClosable: true });
    }
  };

  return (
    <Box>
      <PageHeader title="Payroll" subtitle="Manage payslips and salary processing" />

      {/* Period selector */}
      <Flex gap={3} mb={5} flexWrap="wrap">
        <StyledSelect w="160px" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </StyledSelect>
        <StyledInput w="100px" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2099} />
      </Flex>

      {/* Summary cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <Box key={s.label} bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="surface.border" shadow="card">
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="text.muted" fontWeight="500">{s.label}</Text>
                  <Text fontSize="xl" fontWeight="700" color="text.heading" mt={1}>{s.value}</Text>
                </Box>
                <Flex w={10} h={10} borderRadius="lg" bg={s.bg} align="center" justify="center">
                  <Icon size={20} color={s.color} />
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Tabs */}
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab fontWeight="600" fontSize="sm">Manual Payroll</Tab>
          <Tab fontWeight="600" fontSize="sm">Bulk Upload</Tab>
          <Tab fontWeight="600" fontSize="sm">Records</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <ManualPayrollTab month={month} year={year} onGenerated={fetchData} />
          </TabPanel>
          <TabPanel px={0}>
            <BulkUploadTab month={month} year={year} onComplete={fetchData} />
          </TabPanel>
          <TabPanel px={0}>
            <SectionCard title={`Payroll Records — ${MONTHS[month - 1]} ${year}`} noPadding>
              <Box px={5} pb={5}>
                <Flex mb={4} gap={3} align="center">
                  <StyledInput
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    maxW="300px"
                  />
                  {loading && <Spinner size="sm" color="brand.500" />}
                </Flex>
                <DataTable<PayrollRecordType> columns={columns} data={records} keyField="id" />
              </Box>
            </SectionCard>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

// ─── Manual Payroll Tab ───
function ManualPayrollTab({
  month,
  year,
  onGenerated,
}: {
  month: number;
  year: number;
  onGenerated: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [preview, setPreview] = useState<PayrollPreview | null>(null);
  const [earnings, setEarnings] = useState<PayrollComponent[]>([]);
  const [deductions, setDeductions] = useState<PayrollComponent[]>([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const handlePreview = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await payrollApi.preview({ employeeId, month, year });
      setPreview(data);
      setEarnings(data.earnings.length > 0 ? data.earnings : [{ name: "Basic", amount: 0 }]);
      setDeductions(data.deductions.length > 0 ? data.deductions : []);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err.message, status: "error", duration: 3500, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const grossEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);
  const netPay = grossEarnings - totalDeductions;

  const handleGenerate = async () => {
    if (!employeeId || earnings.length === 0) return;
    setGenerating(true);
    try {
      await payrollApi.generate({
        employeeId,
        month,
        year,
        earnings: earnings.filter((e) => e.amount > 0),
        deductions: deductions.filter((d) => d.amount > 0),
        remarks: remarks || undefined,
      });
      toast({ title: "Payroll generated", status: "success", duration: 2500, isClosable: true });
      setPreview(null);
      setEarnings([]);
      setDeductions([]);
      setRemarks("");
      setEmployeeId("");
      onGenerated();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, status: "error", duration: 3500, isClosable: true });
    } finally {
      setGenerating(false);
    }
  };

  const updateEarning = (idx: number, field: "name" | "amount", val: string | number) => {
    setEarnings((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: field === "amount" ? Number(val) : val } : e)));
  };

  const updateDeduction = (idx: number, field: "name" | "amount", val: string | number) => {
    setDeductions((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: field === "amount" ? Number(val) : val } : d)));
  };

  return (
    <SectionCard title="Manual Payroll Generation">
      <EmployeeSelector value={employeeId} onChange={setEmployeeId} />
      <PrimaryButton size="sm" onClick={handlePreview} isLoading={loading} isDisabled={!employeeId} mb={5}>
        Preview Payroll
      </PrimaryButton>

      {preview && (
        <Box>
          {/* Employee info */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={5} p={4} bg="surface.bg" borderRadius="lg">
            <Box>
              <Text fontSize="xs" color="text.muted">Employee</Text>
              <Text fontSize="sm" fontWeight="600">{preview.employeeName} ({preview.employeeCode})</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="text.muted">Department</Text>
              <Text fontSize="sm" fontWeight="600">{preview.department || "—"}</Text>
            </Box>
            <Box>
              <Text fontSize="xs" color="text.muted">Attendance</Text>
              <Text fontSize="sm" fontWeight="600">
                Working: {preview.workingDays} | Present: {preview.presentDays} | LOP: {preview.lopDays}
              </Text>
            </Box>
          </SimpleGrid>

          {/* Earnings */}
          <Text fontSize="sm" fontWeight="700" color="text.heading" mb={2}>Earnings</Text>
          {earnings.map((e, idx) => (
            <Flex key={idx} gap={3} mb={2} align="center">
              <StyledInput
                value={e.name}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => updateEarning(idx, "name", ev.target.value)}
                placeholder="Component name"
                flex={1}
              />
              <StyledInput
                type="number"
                value={e.amount}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => updateEarning(idx, "amount", ev.target.value)}
                placeholder="Amount"
                w="140px"
              />
              <IconButton
                aria-label="Remove"
                icon={<Trash2 size={14} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => setEarnings((p) => p.filter((_, i) => i !== idx))}
              />
            </Flex>
          ))}
          <SecondaryButton size="xs" leftIcon={<Plus size={14} />} onClick={() => setEarnings((p) => [...p, { name: "", amount: 0 }])} mb={4}>
            Add Earning
          </SecondaryButton>

          {/* Deductions */}
          <Text fontSize="sm" fontWeight="700" color="text.heading" mb={2}>Deductions</Text>
          {deductions.map((d, idx) => (
            <Flex key={idx} gap={3} mb={2} align="center">
              <StyledInput
                value={d.name}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => updateDeduction(idx, "name", ev.target.value)}
                placeholder="Component name"
                flex={1}
              />
              <StyledInput
                type="number"
                value={d.amount}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => updateDeduction(idx, "amount", ev.target.value)}
                placeholder="Amount"
                w="140px"
              />
              <IconButton
                aria-label="Remove"
                icon={<Trash2 size={14} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => setDeductions((p) => p.filter((_, i) => i !== idx))}
              />
            </Flex>
          ))}
          <SecondaryButton size="xs" leftIcon={<Plus size={14} />} onClick={() => setDeductions((p) => [...p, { name: "", amount: 0 }])} mb={5}>
            Add Deduction
          </SecondaryButton>

          {/* Summary & Remarks */}
          <Box p={4} bg="purple.50" borderRadius="lg" mb={4}>
            <SimpleGrid columns={3} spacing={4}>
              <Box><Text fontSize="xs" color="text.muted">Gross Earnings</Text><Text fontWeight="700" color="#0D7C47">₹{grossEarnings.toLocaleString("en-IN")}</Text></Box>
              <Box><Text fontSize="xs" color="text.muted">Total Deductions</Text><Text fontWeight="700" color="#C41E3A">₹{totalDeductions.toLocaleString("en-IN")}</Text></Box>
              <Box><Text fontSize="xs" color="text.muted">Net Pay</Text><Text fontWeight="700" fontSize="lg" color="brand.600">₹{netPay.toLocaleString("en-IN")}</Text></Box>
            </SimpleGrid>
          </Box>

          <Field label="Remarks (optional)">
            <StyledInput
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)}
              placeholder="Optional notes"
              mb={4}
            />
          </Field>

          <PrimaryButton onClick={handleGenerate} isLoading={generating} isDisabled={earnings.filter((e) => e.amount > 0).length === 0}>
            Generate Payslip
          </PrimaryButton>
        </Box>
      )}
    </SectionCard>
  );
}

// ─── Bulk Upload Tab ───
function BulkUploadTab({
  month,
  year,
  onComplete,
}: {
  month: number;
  year: number;
  onComplete: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<ImportJobStatusType | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("month", String(month));
      fd.append("year", String(year));
      const result = await payrollApi.bulkImport(fd);
      toast({ title: "Import started", description: `Processing ${result.totalRows} rows`, status: "info", duration: 3000, isClosable: true });

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const status = await payrollApi.importStatus(result.jobId);
          setJobStatus(status);
          if (status.status === "COMPLETED" || status.status === "FAILED" || status.status === "PARTIAL_SUCCESS") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            onComplete();
            toast({
              title: status.status === "COMPLETED" ? "Import completed" : status.status === "FAILED" ? "Import failed" : "Import partially completed",
              description: `${status.successRows} succeeded, ${status.failedRows} failed out of ${status.totalRows}`,
              status: status.status === "COMPLETED" ? "success" : status.status === "FAILED" ? "error" : "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch {
          // continue polling
        }
      }, 2000);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, status: "error", duration: 3500, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const url = payrollApi.downloadTemplate();
    const token = getAccessToken();
    window.open(`${url}?token=${token}`, "_blank");
  };

  return (
    <SectionCard title="Bulk Payroll Upload">
      <Flex gap={3} mb={5}>
        <SecondaryButton size="sm" leftIcon={<FileSpreadsheet size={16} />} onClick={handleDownloadTemplate}>
          Download Template
        </SecondaryButton>
      </Flex>

      <Box
        border="2px dashed"
        borderColor={file ? "brand.400" : "surface.border"}
        borderRadius="xl"
        p={8}
        textAlign="center"
        cursor="pointer"
        onClick={() => inputRef.current?.click()}
        bg={file ? "purple.50" : "surface.bg"}
        mb={4}
        transition="all 0.15s"
        _hover={{ borderColor: "brand.400" }}
      >
        <Input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          display="none"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Upload size={32} color="#8B5CF6" style={{ margin: "0 auto 8px" }} />
        {file ? (
          <Text fontSize="sm" fontWeight="600" color="brand.600">{file.name}</Text>
        ) : (
          <Text fontSize="sm" color="text.muted">Click or drag Excel file here</Text>
        )}
      </Box>

      <PrimaryButton size="sm" onClick={handleUpload} isLoading={uploading} isDisabled={!file}>
        Start Import
      </PrimaryButton>

      {jobStatus && (
        <Box mt={5} p={4} borderRadius="lg" border="1px solid" borderColor="surface.border">
          <Flex justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="600">Import Progress</Text>
            <Badge colorScheme={jobStatus.status === "COMPLETED" ? "green" : jobStatus.status === "FAILED" ? "red" : "yellow"}>
              {jobStatus.status}
            </Badge>
          </Flex>
          <Progress
            value={jobStatus.progressPercentage}
            colorScheme="purple"
            borderRadius="full"
            size="sm"
            mb={2}
          />
          <SimpleGrid columns={4} spacing={3}>
            <Box><Text fontSize="xs" color="text.muted">Total</Text><Text fontSize="sm" fontWeight="600">{jobStatus.totalRows}</Text></Box>
            <Box><Text fontSize="xs" color="text.muted">Processed</Text><Text fontSize="sm" fontWeight="600">{jobStatus.processedRows}</Text></Box>
            <Box><Text fontSize="xs" color="text.muted">Success</Text><Text fontSize="sm" fontWeight="600" color="#0D7C47">{jobStatus.successRows}</Text></Box>
            <Box><Text fontSize="xs" color="text.muted">Failed</Text><Text fontSize="sm" fontWeight="600" color="#C41E3A">{jobStatus.failedRows}</Text></Box>
          </SimpleGrid>

          {jobStatus.errorSummary.length > 0 && (
            <Box mt={3}>
              <Text fontSize="xs" fontWeight="600" color="#C41E3A" mb={1}>Errors:</Text>
              <Box maxH="150px" overflowY="auto" fontSize="xs" color="text.muted">
                {jobStatus.errorSummary.slice(0, 20).map((err, i) => (
                  <Text key={i}>Row {err.row}: {err.message}</Text>
                ))}
                {jobStatus.errorSummary.length > 20 && (
                  <Text fontWeight="600">...and {jobStatus.errorSummary.length - 20} more</Text>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </SectionCard>
  );
}
