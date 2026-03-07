"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text, VStack, Spinner } from "@chakra-ui/react";
import { CalendarDays } from "lucide-react";
import SectionCard from "./SectionCard";
import { sharedDashboardApi, type UpcomingHoliday } from "@/api/profile.api";

export default function UpcomingHolidaysWidget(props: Record<string, any>) {
  const [holidays, setHolidays] = useState<UpcomingHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sharedDashboardApi
      .getUpcomingHolidays(5)
      .then(setHolidays)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionCard
      title="Upcoming Holidays"
      actions={
        <Flex align="center" color="brand.400">
          <CalendarDays size={14} />
        </Flex>
      }
      {...props}
    >
      {loading ? (
        <Flex justify="center" py={8}>
          <Spinner size="sm" color="brand.400" />
        </Flex>
      ) : holidays.length === 0 ? (
        <Flex justify="center" py={8}>
          <Text fontSize="sm" color="text.muted">
            No upcoming holidays scheduled.
          </Text>
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {holidays.map((h) => {
            const dt = new Date(h.date + "T00:00:00");
            const monthStr = dt.toLocaleString("en-US", { month: "short" });
            const dayNum = dt.getDate();
            return (
              <Flex
                key={h.id}
                align="center"
                gap={3}
                p={3}
                borderRadius="lg"
                bg="surface.bg"
              >
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="white"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  border="1px solid"
                  borderColor="surface.border"
                  direction="column"
                >
                  <Text fontSize="xs" fontWeight="700" color="brand.400" lineHeight="1">
                    {dayNum}
                  </Text>
                  <Text fontSize="10px" color="text.muted" lineHeight="1">
                    {monthStr}
                  </Text>
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="text.heading" isTruncated>
                    {h.name}
                  </Text>
                  <Text fontSize="xs" color="text.muted">
                    {h.dayName}
                  </Text>
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  bg={h.daysLeft === 0 ? "#E6F9F0" : "#F0EBFF"}
                  color={h.daysLeft === 0 ? "#0D7C47" : "#6B46C1"}
                  flexShrink={0}
                >
                  {h.daysLeft === 0 ? "Today" : `In ${h.daysLeft}d`}
                </Text>
              </Flex>
            );
          })}
        </VStack>
      )}
    </SectionCard>
  );
}
