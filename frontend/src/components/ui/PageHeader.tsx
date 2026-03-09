"use client";

import { Box, Flex, Heading, Text, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface PageHeaderProps extends BoxProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions, ...rest }: PageHeaderProps) {
  return (
    <Flex
      justify="space-between"
      align={{ base: "flex-start", md: "center" }}
      direction={{ base: "column", md: "row" }}
      gap={4}
      mb={8}
      {...rest}
    >
      <Box>
        <Heading size="lg" color="text.heading" fontWeight="700" letterSpacing="-0.01em">
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize="sm" color="text.muted" mt={1.5}>
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && <Flex gap={3}>{actions}</Flex>}
    </Flex>
  );
}
