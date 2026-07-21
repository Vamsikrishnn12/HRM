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
      mb={{ base: 5, md: 8 }}
      {...rest}
    >
      <Box>
        <Heading
          fontSize={{ base: "2xl", md: "3xl" }}
          color="text.heading"
          fontWeight="800"
          letterSpacing="-0.02em"
          lineHeight="1.2"
        >
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize={{ base: "xs", md: "sm" }} color="text.muted" mt={1.5} fontWeight="500" maxW="680px">
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && <Flex gap={3} flexWrap="wrap">{actions}</Flex>}
    </Flex>
  );
}
