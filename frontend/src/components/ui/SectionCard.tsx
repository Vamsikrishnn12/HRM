"use client";

import { Box, Flex, Heading, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SectionCardProps extends BoxProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export default function SectionCard({
  title,
  actions,
  children,
  noPadding,
  ...rest
}: SectionCardProps) {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
      overflow="hidden"
      {...rest}
    >
      {title && (
        <Flex
          justify="space-between"
          align="center"
          px={5}
          py={4}
          borderBottom="1px solid"
          borderColor="surface.border"
        >
          <Heading size="sm" color="text.heading" fontWeight="600">
            {title}
          </Heading>
          {actions}
        </Flex>
      )}
      <Box p={noPadding ? 0 : 5}>{children}</Box>
    </Box>
  );
}
