"use client";

import { Box, Text } from "@chakra-ui/react";

export default function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="text.muted" fontWeight="500">{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="text.heading">{value}</Text>
    </Box>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box>
      <Text fontSize="xs" color="text.muted" mb={0.5}>{label}</Text>
      <Text fontSize="sm" fontWeight="600" color="text.heading">{value || "-"}</Text>
    </Box>
  );
}
