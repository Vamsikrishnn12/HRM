"use client";

import { Box, Flex, Text } from "@chakra-ui/react";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: string;
  /** Progress percentage for the ring (0-100). Defaults to 0. */
  progress?: number;
}

function CircularProgressRing({ value }: { value: number }) {
  const size = 68;
  const strokeWidth = 5.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = `stat-ring-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7548b9" />
            <stop offset="100%" stopColor="#359de9" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E4F0"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      {/* Center percentage text */}
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
      >
        <Text fontSize="13px" fontWeight="700" color="text.heading" lineHeight="1">
          {clamped}%
        </Text>
      </Flex>
    </Box>
  );
}

/** Parse a numeric percentage from the value string, or fall back to the change. */
function deriveProgress(value: string, change: string): number {
  // Try to extract a number from the value (e.g. "92%" → 92, "₹1.2L" → 0)
  const valMatch = value.replace(/,/g, "").match(/^(\d+(?:\.\d+)?)%?$/);
  if (valMatch) {
    const n = parseFloat(valMatch[1]);
    if (n >= 0 && n <= 100) return Math.round(n);
  }
  // Fall back to change string (e.g. "+4.3%" → 4.3 → clamp to reasonable display)
  const chgMatch = change.replace(/,/g, "").match(/([\d.]+)%?/);
  if (chgMatch) {
    const n = parseFloat(chgMatch[1]);
    // Scale small percentages to look meaningful on the ring
    if (n >= 0 && n <= 100) return Math.round(Math.min(n * 5, 100));
  }
  return 65; // default
}

export default function StatCard({ label, value, change, changeType, icon, progress }: StatCardProps) {
  const ringValue = progress ?? deriveProgress(value, change);
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
      {/* Subtle gradient accent line at top */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        bgGradient="linear(135deg, #7548b9, #359de9)"
        borderTopRadius="2xl"
      />

      <Flex justify="space-between" align="center" gap={4}>
        {/* Left: text content */}
        <Box flex={1} minW={0}>
          <Text
            fontSize="xs"
            color="text.muted"
            fontWeight="600"
            mb={1}
            textTransform="uppercase"
            letterSpacing="wider"
            noOfLines={1}
          >
            {label}
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="text.heading"
            lineHeight="1.1"
            mb={2.5}
          >
            {value}
          </Text>
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
              <Text fontSize="xs" fontWeight="600" color={changeColor}>
                {change}
              </Text>
            </Flex>
            <Text fontSize="xs" color="text.muted" noOfLines={1}>
              vs last period
            </Text>
          </Flex>
        </Box>

        {/* Right: circular progress ring */}
        <CircularProgressRing value={ringValue} />
      </Flex>
    </Box>
  );
}
