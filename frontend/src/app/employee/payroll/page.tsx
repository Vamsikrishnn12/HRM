"use client";

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { Wallet } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import PageHeader from "@/components/ui/PageHeader";

export default function EmployeePayrollPage() {
  return (
    <Box>
      <PageHeader title="Payroll" subtitle="View your salary details and payslips" />
      <SectionCard>
        <Flex direction="column" align="center" justify="center" py={16} textAlign="center">
          <Flex
            w={14}
            h={14}
            borderRadius="2xl"
            bgGradient="linear(to-br, brand.400, brand.700)"
            align="center"
            justify="center"
            mb={4}
          >
            <Wallet size={24} color="white" />
          </Flex>
          <Heading size="md" color="text.heading" mb={2}>
            Payroll & Payslips
          </Heading>
          <Text color="text.muted" fontSize="sm" maxW="400px">
            Payslip downloads and salary details will be available here soon.
          </Text>
        </Flex>
      </SectionCard>
    </Box>
  );
}
