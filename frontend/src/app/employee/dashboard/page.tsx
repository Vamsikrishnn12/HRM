"use client";

import { Box, Flex, Heading, Text, SimpleGrid } from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import SectionCard from "@/components/ui/SectionCard";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <Box>
      <Heading size="lg" color="text.heading" mb={2}>
        Welcome, {user ? `${user.firstName} ${user.lastName}` : "Employee"}
      </Heading>
      <Text color="text.muted" fontSize="sm" mb={6}>
        Your personal dashboard {user?.empId && `• ${user.empId}`}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <SectionCard>
          <Flex direction="column" gap={2}>
            <Text fontSize="sm" color="text.muted" fontWeight="500">Employee ID</Text>
            <Text fontSize="lg" fontWeight="700" color="text.heading">{user?.empId || "—"}</Text>
          </Flex>
        </SectionCard>
        <SectionCard>
          <Flex direction="column" gap={2}>
            <Text fontSize="sm" color="text.muted" fontWeight="500">Email</Text>
            <Text fontSize="lg" fontWeight="700" color="text.heading">{user?.email || "—"}</Text>
          </Flex>
        </SectionCard>
      </SimpleGrid>

      <SectionCard>
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={16}
          textAlign="center"
        >
          <Flex
            w={16}
            h={16}
            borderRadius="2xl"
            bgGradient="linear(to-br, brand.400, brand.700)"
            align="center"
            justify="center"
            mb={4}
          >
            <Text fontSize="xl" fontWeight="800" color="white">
              HR
            </Text>
          </Flex>
          <Heading size="md" color="text.heading" mb={2}>
            Welcome to Your Dashboard
          </Heading>
          <Text color="text.muted" fontSize="sm" maxW="400px">
            This is your employee dashboard. Features like attendance tracking,
            leave applications, and payslip downloads will be available here
            soon.
          </Text>
        </Flex>
      </SectionCard>
    </Box>
  );
}
