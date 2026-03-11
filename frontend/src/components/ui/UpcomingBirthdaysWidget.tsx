"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text, VStack, Spinner, Avatar } from "@chakra-ui/react";
import { Cake } from "lucide-react";
import SectionCard from "./SectionCard";
import { sharedDashboardApi, type UpcomingBirthday } from "@/api/profile.api";

export default function UpcomingBirthdaysWidget(props: Record<string, any>) {
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sharedDashboardApi
      .getUpcomingBirthdays(30)
      .then(setBirthdays)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard
      title="Upcoming Birthdays"
      actions={
        <Flex
          align="center"
          justify="center"
          w={7}
          h={7}
          borderRadius="lg"
          bgGradient="linear(135deg, #7548b9, #359de9)"
        >
          <Cake size={14} color="white" />
        </Flex>
      }
      {...props}
    >
      {loading ? (
        <Flex justify="center" py={8}>
          <Spinner size="sm" color="brand.400" />
        </Flex>
      ) : birthdays.length === 0 ? (
        <Flex justify="center" py={8}>
          <Text fontSize="sm" color="text.muted" fontWeight="500">
            No upcoming birthdays in the next 30 days.
          </Text>
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {birthdays.map((b) => (
            <Flex
              key={b.employeeId}
              align="center"
              gap={3}
              p={3}
              borderRadius="xl"
              bg="surface.bg"
              _hover={{ bg: "brand.50", transform: "translateX(2px)" }}
              transition="all 0.25s cubic-bezier(.4,0,.2,1)"
            >
              <Avatar size="sm" name={b.fullName} bg="brand.400" color="white" />
              <Box flex={1} minW={0}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="text.heading"
                  isTruncated
                >
                  {b.fullName}
                </Text>
                <Text fontSize="xs" color="text.muted" isTruncated fontWeight="500">
                  {b.department}{b.designation ? ` • ${b.designation}` : ""}
                </Text>
              </Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                px={2.5}
                py={0.5}
                borderRadius="full"
                bg={b.daysLeft === 0 ? "#E6F9F0" : "brand.50"}
                color={b.daysLeft === 0 ? "#0D7C47" : "brand.400"}
                flexShrink={0}
              >
                {b.daysLeft === 0 ? "🎂 Today" : `In ${b.daysLeft}d`}
              </Text>
            </Flex>
          ))}
        </VStack>
      )}
    </SectionCard>
  );
}
