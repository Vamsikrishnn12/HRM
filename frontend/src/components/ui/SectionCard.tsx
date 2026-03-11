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
      borderRadius="2xl"
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
      overflow="hidden"
      transition="all 0.3s cubic-bezier(.4,0,.2,1)"
      _hover={{ shadow: "soft" }}
      {...rest}
    >
      {title && (
        <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor="surface.border"
        >
          <Heading size="sm" color="text.heading" fontWeight="700" letterSpacing="-0.01em">
            {title}
          </Heading>
          {actions}
        </Flex>
      )}
      <Box p={noPadding ? 0 : 6}>{children}</Box>
    </Box>
  );
}
