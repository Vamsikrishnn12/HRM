"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import {
  Users,
  UserCheck,
  CalendarOff,
  Wallet,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  CalendarOff,
  Wallet,
  Clock,
  FileText,
};

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: string;
}

export default function StatCard({ label, value, change, changeType, icon }: StatCardProps) {
  const Icon = iconMap[icon] ?? FileText;
  const changeColor =
    changeType === "up" ? "#0D7C47" : changeType === "down" ? "#C41E3A" : "#516079";
  const changeBg =
    changeType === "up" ? "#E6F9F0" : changeType === "down" ? "#FEE7E7" : "#F8F8FC";
  const TrendIcon =
    changeType === "up" ? TrendingUp : changeType === "down" ? TrendingDown : Minus;

  return (
    <Box
      bg="white"
      borderRadius="xl"
      p={5}
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
      transition="all 0.2s"
      _hover={{ shadow: "card-hover", transform: "translateY(-2px)" }}
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <Box>
          <Text fontSize="sm" color="text.muted" fontWeight="500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="text.heading" lineHeight="1.2">
            {value}
          </Text>
        </Box>
        <Flex
          w={10}
          h={10}
          borderRadius="lg"
          bg="brand.50"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon size={20} color="#8B5CF6" aria-hidden="true" />
        </Flex>
      </Flex>
      <Flex align="center" gap={1.5}>
        <Flex
          align="center"
          gap={1}
          px={2}
          py={0.5}
          borderRadius="full"
          bg={changeBg}
          display="inline-flex"
        >
          <TrendIcon size={12} color={changeColor} />
          <Text fontSize="xs" fontWeight="600" color={changeColor}>
            {change}
          </Text>
        </Flex>
        <Text fontSize="xs" color="text.muted">
          vs last period
        </Text>
      </Flex>
    </Box>
  );
}
