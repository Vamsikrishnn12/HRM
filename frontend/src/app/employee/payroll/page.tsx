"use client";

import { useState, useEffect, useMemo } from "react";
import { Box, SimpleGrid, Flex, Text, Spinner } from "@chakra-ui/react";
import { Wallet, Download, FileText, Calendar } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { StyledSelect } from "@/components/ui/FormHelpers";
import { PrimaryButton } from "@/components/ui/Buttons";
import { payrollApi, type PayrollRecordType } from "@/api";
import { getAccessToken } from "@/lib/api";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const currentYear = new Date().getFullYear();

export default function EmployeePayrollPage() {
  const [year, setYear] = useState(currentYear);
  const [records, setRecords] = useState<PayrollRecordType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    payrollApi
      .myPayslips(year)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [year]);

  const handleDownload = (id: string) => {
    const url = payrollApi.myPayslipDownloadUrl(id);
    const token = getAccessToken();
    const a = document.createElement("a");
    a.href = `${url}?token=${token}`;
    a.target = "_blank";
    a.click();
  };

  const columns = useMemo<Column<PayrollRecordType>[]>(
    () => [
      {
        key: "month",
        header: "Period",
        render: (row) => (
          <Flex align="center" gap={2}>
            <Flex w={8} h={8} borderRadius="lg" bg="brand.50" align="center" justify="center">
              <Calendar size={14} color="#8B5CF6" />
            </Flex>
            <Text fontSize="sm" fontWeight="600" color="text.heading">
              {MONTHS[row.month - 1]} {row.year}
            </Text>
          </Flex>
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
        header: "",
        width: "100px",
        render: (row) =>
          row.hasPayslip ? (
            <PrimaryButton size="xs" leftIcon={<Download size={12} />} onClick={() => handleDownload(row.id)}>
              Download
            </PrimaryButton>
          ) : null,
      },
    ],
    [],
  );

  const totalPaid = records.reduce((s, r) => s + r.netPay, 0);

  return (
    <Box>
      <PageHeader title="Payroll" subtitle="View your salary details and payslips" />

      <Flex gap={3} mb={5} align="center">
        <Text fontSize="sm" fontWeight="600" color="text.heading">Year:</Text>
        <StyledSelect w="120px" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </StyledSelect>
      </Flex>

      {/* Summary */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6}>
        <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="surface.border" shadow="card">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="text.muted" fontWeight="500">Total Payslips</Text>
              <Text fontSize="xl" fontWeight="700" color="text.heading" mt={1}>{records.length}</Text>
            </Box>
            <Flex w={10} h={10} borderRadius="lg" bg="#F3EEFE" align="center" justify="center">
              <FileText size={20} color="#8B5CF6" />
            </Flex>
          </Flex>
        </Box>
        <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="surface.border" shadow="card">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="text.muted" fontWeight="500">Total Received</Text>
              <Text fontSize="xl" fontWeight="700" color="text.heading" mt={1}>₹{totalPaid.toLocaleString("en-IN")}</Text>
            </Box>
            <Flex w={10} h={10} borderRadius="lg" bg="#E6F9F0" align="center" justify="center">
              <Wallet size={20} color="#0D7C47" />
            </Flex>
          </Flex>
        </Box>
        <Box bg="white" borderRadius="xl" p={5} border="1px solid" borderColor="surface.border" shadow="card">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" color="text.muted" fontWeight="500">Latest Net Pay</Text>
              <Text fontSize="xl" fontWeight="700" color="text.heading" mt={1}>
                {records.length > 0 ? `₹${records[0].netPay.toLocaleString("en-IN")}` : "—"}
              </Text>
            </Box>
            <Flex w={10} h={10} borderRadius="lg" bg="#FFF4E5" align="center" justify="center">
              <Wallet size={20} color="#B25E09" />
            </Flex>
          </Flex>
        </Box>
      </SimpleGrid>

      <SectionCard title={`Payslips — ${year}`} noPadding>
        <Box p={5}>
          {loading ? (
            <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>
          ) : records.length === 0 ? (
            <Flex direction="column" align="center" py={12} textAlign="center">
              <Flex w={14} h={14} borderRadius="2xl" bg="brand.50" align="center" justify="center" mb={4}>
                <Wallet size={24} color="#8B5CF6" />
              </Flex>
              <Text fontWeight="600" color="text.heading" mb={1}>No Payslips Yet</Text>
              <Text color="text.muted" fontSize="sm">Your payslips for {year} will appear here once generated.</Text>
            </Flex>
          ) : (
            <DataTable<PayrollRecordType> columns={columns} data={records} keyField="id" />
          )}
        </Box>
      </SectionCard>
    </Box>
  );
}
