"use client";

import { useMemo, useState } from "react";
import { Box, Flex, SimpleGrid, Text, useToast } from "@chakra-ui/react";
import { Download, FileSpreadsheet } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmployeeSelector from "@/components/ui/EmployeeSelector";
import { PrimaryButton } from "@/components/ui/Buttons";
import { Field, StyledInput, StyledSelect } from "@/components/ui/FormHelpers";
import { payrollApi } from "@/api";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const now = new Date();

export default function ReportsPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [downloadingAttendance, setDownloadingAttendance] = useState(false);
  const [downloadingSalary, setDownloadingSalary] = useState(false);
  const toast = useToast();

  const titlePeriod = useMemo(
    () => `${MONTHS[month - 1]} ${year}`,
    [month, year],
  );

  const handleAttendanceReport = async () => {
    if (!employeeId) {
      toast({
        title: "Select employee",
        description: "Choose an employee to export attendance report.",
        status: "warning",
      });
      return;
    }
    setDownloadingAttendance(true);
    try {
      await payrollApi.downloadAttendanceReport({ employeeId, month, year });
      toast({ title: "Attendance report downloaded", status: "success" });
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message,
        status: "error",
      });
    } finally {
      setDownloadingAttendance(false);
    }
  };

  const handleSalaryReport = async () => {
    setDownloadingSalary(true);
    try {
      await payrollApi.downloadSalaryReport({ month, year });
      toast({ title: "Salary report downloaded", status: "success" });
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message,
        status: "error",
      });
    } finally {
      setDownloadingSalary(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Export attendance and salary reports"
      />

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <SectionCard title="Attendance Report">
          <Text fontSize="sm" color="text.muted" mb={4}>
            Employee-wise monthly attendance summary and day-level export for{" "}
            <strong>{titlePeriod}</strong>.
          </Text>
          <Field label="Employee">
            <EmployeeSelector value={employeeId} onChange={setEmployeeId} />
          </Field>
          <Flex gap={3} mt={4}>
            <Box flex={1}>
              <Field label="Month">
                <StyledSelect
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </StyledSelect>
              </Field>
            </Box>
            <Box flex={1}>
              <Field label="Year">
                <StyledInput
                  type="number"
                  value={year}
                  min={2020}
                  max={2099}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </Field>
            </Box>
          </Flex>
          <PrimaryButton
            mt={4}
            leftIcon={<Download size={14} />}
            onClick={handleAttendanceReport}
            isLoading={downloadingAttendance}
          >
            Download Attendance Excel
          </PrimaryButton>
        </SectionCard>

        <SectionCard title="Salary Report">
          <Text fontSize="sm" color="text.muted" mb={4}>
            Month-wise payroll export across all generated payroll records for{" "}
            <strong>{titlePeriod}</strong>.
          </Text>
          <Flex gap={3}>
            <Box flex={1}>
              <Field label="Month">
                <StyledSelect
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </StyledSelect>
              </Field>
            </Box>
            <Box flex={1}>
              <Field label="Year">
                <StyledInput
                  type="number"
                  value={year}
                  min={2020}
                  max={2099}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </Field>
            </Box>
          </Flex>
          <PrimaryButton
            mt={4}
            leftIcon={<FileSpreadsheet size={14} />}
            onClick={handleSalaryReport}
            isLoading={downloadingSalary}
          >
            Download Salary Excel
          </PrimaryButton>
        </SectionCard>
      </SimpleGrid>
    </Box>
  );
}
