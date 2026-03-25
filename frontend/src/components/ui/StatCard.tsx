"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { Clock, Clock3, FileText, CalendarOff, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType: "up" | "down" | "neutral";
  icon: string;
  progress?: number | null;
  caption?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  Wallet,
  Clock,
  Clock3,
  CalendarOff,
  FileText,
};

function CircularProgressRing({ value }: { value: number }) {
  const size = 72;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="stat-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7548b9" />
            <stop offset="100%" stopColor="#359de9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E4F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#stat-ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <Flex position="absolute" inset={0} align="center" justify="center">
        <Text fontSize="12px" fontWeight="800" color="text.heading" lineHeight="1">
          {clamped}%
        </Text>
      </Flex>
    </Box>
  );
}

export default function StatCard({
  label,
  value,
  change,
  changeType,
  icon,
  progress,
  caption,
}: StatCardProps) {
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);
  const Icon = iconMap[icon] ?? FileText;

  const changeColor =
    changeType === "up" ? "#0D7C47" : changeType === "down" ? "#C41E3A" : "#7C7F99";
  const changeBg =
    changeType === "up" ? "#E6F9F0" : changeType === "down" ? "#FEF0F0" : "#F4F2F9";

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
      transition="all 0.3s cubic-bezier(.4,0,.2,1)"
      _hover={{ shadow: "card-hover", transform: "translateY(-3px)" }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bgGradient="linear(135deg, #7548b9, #359de9)"
        borderTopRadius="2xl"
      />

      <Flex justify="space-between" align="flex-start" gap={4}>
        <Box flex={1} minW={0}>
          <Text
            fontSize="11px"
            color="text.muted"
            fontWeight="700"
            mb={1}
            textTransform="uppercase"
            letterSpacing="0.08em"
            noOfLines={1}
          >
            {label}
          </Text>

          <Text fontSize="3xl" fontWeight="800" color="text.heading" lineHeight="1.1" mb={3}>
            {value}
          </Text>

          {change ? (
            <Flex align="center" gap={2} wrap="wrap">
              <Flex
                align="center"
                px={2.5}
                py={1}
                borderRadius="full"
                bg={changeBg}
                display="inline-flex"
              >
                <Text fontSize="xs" fontWeight="700" color={changeColor}>
                  {change}
                </Text>
              </Flex>
              {caption ? (
                <Text fontSize="xs" color="text.muted" fontWeight="600" noOfLines={1}>
                  {caption}
                </Text>
              ) : null}
            </Flex>
          ) : caption ? (
            <Text fontSize="xs" color="text.muted" fontWeight="600" noOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </Box>

        {hasProgress ? (
          <CircularProgressRing value={progress} />
        ) : (
          <Flex
            w="44px"
            h="44px"
            borderRadius="xl"
            align="center"
            justify="center"
            bg="brand.50"
            border="1px solid"
            borderColor="brand.100"
            color="brand.500"
            flexShrink={0}
          >
            <Icon size={18} />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
