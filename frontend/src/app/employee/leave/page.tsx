"use client";

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { CalendarOff } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import PageHeader from "@/components/ui/PageHeader";

export default function EmployeeLeavePage() {
  return (
    <Box>
      <PageHeader title="Leave" subtitle="Manage your leave requests" />
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
            <CalendarOff size={24} color="white" />
          </Flex>
          <Heading size="md" color="text.heading" mb={2}>
            Leave Management
          </Heading>
          <Text color="text.muted" fontSize="sm" maxW="400px">
            Leave application and tracking will be available here soon.
          </Text>
        </Flex>
      </SectionCard>
    </Box>
  );
}
