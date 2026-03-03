"use client";

import { useMemo } from "react";
import { Box, SimpleGrid, Flex, Text } from "@chakra-ui/react";
import { DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { payrollRecords, type PayrollRecord } from "@/lib/mockData";

const payrollSummary = [
  { label: "Total Payroll", value: "$47,720", icon: DollarSign, color: "#8B5CF6", bg: "#F3EEFE" },
  { label: "Processed", value: "4", icon: TrendingUp, color: "#0D7C47", bg: "#E6F9F0" },
  { label: "Pending", value: "1", icon: Clock, color: "#B25E09", bg: "#FFF4E5" },
  { label: "On Hold", value: "1", icon: AlertCircle, color: "#C41E3A", bg: "#FEE7E7" },
];

export default function PayrollPage() {
  const columns = useMemo<Column<PayrollRecord>[]>(
    () => [
      { key: "id", header: "ID", width: "80px" },
      {
        key: "employeeName",
        header: "Employee",
        render: (row) => (
          <Box>
            <Text fontWeight="600" color="text.heading" fontSize="sm">
              {row.employeeName}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {row.department}
            </Text>
          </Box>
        ),
      },
      {
        key: "basicSalary",
        header: "Basic",
        render: (row) => <Text fontSize="sm">${row.basicSalary.toLocaleString()}</Text>,
      },
      {
        key: "allowances",
        header: "Allowances",
        render: (row) => (
          <Text fontSize="sm" color="#0D7C47">
            +${row.allowances.toLocaleString()}
          </Text>
        ),
      },
      {
        key: "deductions",
        header: "Deductions",
        render: (row) => (
          <Text fontSize="sm" color="#C41E3A">
            -${row.deductions.toLocaleString()}
          </Text>
        ),
      },
      {
        key: "netPay",
        header: "Net Pay",
        render: (row) => (
          <Text fontWeight="700" color="text.heading" fontSize="sm">
            ${row.netPay.toLocaleString()}
          </Text>
        ),
      },
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
      <PageHeader title="Payroll" subtitle="February 2026 payroll overview" />

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
        {payrollSummary.map((s) => {
          const Icon = s.icon;
          return (
            <Box
              key={s.label}
              bg="white"
              borderRadius="xl"
              p={5}
              border="1px solid"
              borderColor="surface.border"
              shadow="card"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="text.muted" fontWeight="500">
                    {s.label}
                  </Text>
                  <Text fontSize="xl" fontWeight="700" color="text.heading" mt={1}>
                    {s.value}
                  </Text>
                </Box>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={s.bg}
                  align="center"
                  justify="center"
                >
                  <Icon size={20} color={s.color} />
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </SimpleGrid>

      <SectionCard title="Payslip Records — Feb 2026" noPadding>
        <Box p={5} pt={0}>
          <DataTable<PayrollRecord> columns={columns} data={payrollRecords} keyField="id" />
        </Box>
      </SectionCard>
    </Box>
  );
}
