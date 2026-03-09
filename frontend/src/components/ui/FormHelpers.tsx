"use client";

import React from "react";
import { FormControl, FormLabel, Input, Select, Text } from "@chakra-ui/react";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="600" color="text.heading" mb={1.5}>
        {label} {required ? <Text as="span" color="red.400">*</Text> : null}
      </FormLabel>
      {children}
    </FormControl>
  );
}

export function StyledInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      size="sm"
      borderRadius="lg"
      bg="white"
      border="1px solid"
      borderColor="surface.border"
      _hover={{ borderColor: "brand.200" }}
      _focus={{ borderColor: "brand.400", boxShadow: "focus-ring", bg: "white" }}
      fontSize="sm"
      autoComplete="off"
      {...props}
    />
  );
}

export function StyledSelect(props: React.ComponentProps<typeof Select>) {
  return (
    <Select
      size="sm"
      borderRadius="lg"
      bg="white"
      border="1px solid"
      borderColor="surface.border"
      _hover={{ borderColor: "brand.200" }}
      _focus={{ borderColor: "brand.400", boxShadow: "focus-ring" }}
      fontSize="sm"
      autoComplete="off"
      {...props}
    />
  );
}
