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
      borderRadius={{ base: "2xl", md: "xl" }}
      border="1px solid"
      borderColor="surface.border"
      shadow="card"
      overflow="hidden"
      transition="all 0.3s cubic-bezier(.4,0,.2,1)"
      _hover={{ shadow: "card-hover", borderColor: "brand.100" }}
      {...rest}
    >
      {title && (
        <Flex
          justify="space-between"
          align="center"
          px={{ base: 4, md: 6 }}
          py={{ base: 3.5, md: 4 }}
          gap={3}
          flexWrap="wrap"
          borderBottom="1px solid"
          borderColor="surface.border"
        >
          <Heading size="sm" color="text.heading" fontWeight="700" letterSpacing="-0.01em">
            {title}
          </Heading>
          {actions}
        </Flex>
      )}
      <Box p={noPadding ? 0 : { base: 4, md: 6 }}>{children}</Box>
    </Box>
  );
}
