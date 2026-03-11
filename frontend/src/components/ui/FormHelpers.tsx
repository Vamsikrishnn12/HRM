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
        {label} {required ? <Text as="span" color="#C41E3A">*</Text> : null}
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
      _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 3px rgba(117,72,185,0.15)", bg: "white" }}
      fontSize="sm"
      fontWeight="500"
      autoComplete="off"
      transition="all 0.25s cubic-bezier(.4,0,.2,1)"
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
      _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 3px rgba(117,72,185,0.15)" }}
      fontSize="sm"
      fontWeight="500"
      autoComplete="off"
      transition="all 0.25s cubic-bezier(.4,0,.2,1)"
      {...props}
    />
  );
}
