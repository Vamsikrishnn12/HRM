"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { CalendarDays } from "lucide-react";
import SectionCard from "./SectionCard";
import {
  sharedDashboardApi,
  type HolidayCalendarEntry,
  type UpcomingHoliday,
} from "@/api/profile.api";

export default function UpcomingHolidaysWidget(props: Record<string, any>) {
  const [holidays, setHolidays] = useState<UpcomingHoliday[]>([]);
  const [calendar, setCalendar] = useState<HolidayCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const calendarYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      sharedDashboardApi.getUpcomingHolidays(5),
      sharedDashboardApi.getHolidayCalendar(calendarYear),
    ])
      .then(([upcoming, fullCalendar]) => {
        setHolidays(upcoming);
        setCalendar(fullCalendar);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [calendarYear]);

  return (
    <>
      <SectionCard
        title="Upcoming Holidays"
        actions={
          <Button size="xs" variant="outline" colorScheme="blue" leftIcon={<CalendarDays size={13} />} onClick={onOpen}>
            {calendarYear} Calendar
          </Button>
        }
        {...props}
      >
      {loading ? (
        <Flex justify="center" py={8}>
          <Spinner size="sm" color="brand.400" />
        </Flex>
      ) : holidays.length === 0 ? (
        <Flex
          justify="center"
          py={8}
          px={4}
          border="1px dashed"
          borderColor="surface.border"
          borderRadius="xl"
          bg="surface.bg"
        >
          <Text fontSize="sm" color="text.muted" fontWeight="600">
            No upcoming holidays scheduled.
          </Text>
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {holidays.map((h) => {
            const dt = new Date(`${h.date}T00:00:00`);
            const monthStr = dt.toLocaleString("en-US", { month: "short" });
            const dayNum = dt.getDate();
            return (
              <Flex
                key={h.id}
                align="center"
                gap={3}
                p={3}
                borderRadius="xl"
                bg="white"
                border="1px solid"
                borderColor="surface.border"
                _hover={{ bg: "brand.50", transform: "translateX(2px)", borderColor: "brand.100" }}
                transition="all 0.25s cubic-bezier(.4,0,.2,1)"
              >
                <Flex
                  w={10}
                  h={10}
                  borderRadius="xl"
                  bg="white"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  border="1px solid"
                  borderColor="surface.border"
                  direction="column"
                  shadow="card"
                >
                  <Text fontSize="xs" fontWeight="800" color="brand.400" lineHeight="1">
                    {dayNum}
                  </Text>
                  <Text fontSize="10px" color="text.muted" lineHeight="1" fontWeight="600">
                    {monthStr}
                  </Text>
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="700" color="text.heading" isTruncated>
                    {h.name}
                  </Text>
                  <Text fontSize="xs" color="text.muted" fontWeight="600">
                    {h.dayName}
                  </Text>
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  bg={h.daysLeft === 0 ? "#E6F9F0" : "brand.50"}
                  color={h.daysLeft === 0 ? "#0D7C47" : "brand.400"}
                  flexShrink={0}
                >
                  {h.daysLeft === 0 ? "Today" : `In ${h.daysLeft}d`}
                </Text>
              </Flex>
            );
          })}
        </VStack>
        )}
        <Text mt={4} fontSize="xs" color="text.muted" lineHeight="tall">
          This holiday calendar may be modified by the organization according to business requirements. Employees should follow the latest calendar displayed here.
        </Text>
      </SectionCard>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>{calendarYear} National &amp; State Holiday Calendar</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box bg="blue.50" border="1px solid" borderColor="blue.100" borderRadius="xl" p={3} mb={4}>
              <Text fontSize="sm" color="blue.800">
                Based on the Government of India/Central Government and Tamil Nadu Government holiday lists for {calendarYear}. The organization may add, remove, or change holidays according to business requirements. Please follow this displayed calendar for your official holidays.
              </Text>
            </Box>
            {calendar.length === 0 ? (
              <Text textAlign="center" color="text.muted" py={8}>No holidays are configured for {calendarYear}.</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {calendar.map((holiday) => {
                  const date = new Date(`${holiday.date}T00:00:00`);
                  const isPast = holiday.date < new Date().toISOString().slice(0, 10);
                  return (
                    <Flex key={holiday.id} align="center" gap={3} border="1px solid" borderColor="surface.border" borderRadius="xl" p={3}>
                      <Flex direction="column" align="center" justify="center" w={12} h={12} bg="brand.50" borderRadius="lg" flexShrink={0}>
                        <Text fontSize="lg" fontWeight="800" color="brand.500" lineHeight="1">{date.getDate()}</Text>
                        <Text fontSize="10px" fontWeight="700" color="text.muted">{date.toLocaleString("en-IN", { month: "short" })}</Text>
                      </Flex>
                      <Box flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="700" color="text.heading">{holiday.name}</Text>
                        <Text fontSize="xs" color="text.muted">{holiday.dayName}</Text>
                      </Box>
                      {isPast && <Badge colorScheme="gray" fontSize="10px">Past</Badge>}
                    </Flex>
                  );
                })}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
