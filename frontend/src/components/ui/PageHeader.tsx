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
      gap={3}
      mb={6}
      {...rest}
    >
      <Box>
        <Heading size="lg" color="text.heading" fontWeight="700">
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize="sm" color="text.muted" mt={1}>
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && <Flex gap={2}>{actions}</Flex>}
    </Flex>
  );
}
