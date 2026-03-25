"use client";

import { useEffect, useState } from "react";
import { Flex, Text, Spinner, VStack, Box } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import type { AuthStatus } from "@/context/AuthContext";
import BrandMark from "@/components/ui/BrandMark";

const messages: Record<string, string[]> = {
  idle: ["Verifying your session..."],
  checking: [
    "Verifying your session...",
    "Checking authentication...",
    "Almost there...",
  ],
  redirecting: [
    "Authentication successful!",
    "Preparing your dashboard...",
    "Setting things up for you...",
  ],
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface AuthLoaderProps {
  status: AuthStatus;
}

export default function AuthLoader({ status }: AuthLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const pool = messages[status] ?? messages.checking;

  // Cycle through messages every 1.2s
  useEffect(() => {
    setMsgIndex(0);
    if (pool.length <= 1) return;

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % pool.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [status, pool.length]);

  const isSuccess = status === "redirecting";

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="surface.bg"
      position="fixed"
      inset={0}
      zIndex={9999}
    >
      <VStack spacing={5}>
        <BrandMark
          logoSize="56px"
          nameFontSize="xl"
          nameColor="text.heading"
          logoRadius="2xl"
          logoShadow="lg"
          priority
        />

        {/* Spinner / Checkmark */}
        {isSuccess ? (
          <Box
            w={6}
            h={6}
            borderRadius="full"
            bg="green.400"
            display="flex"
            alignItems="center"
            justifyContent="center"
            animation={`${fadeIn} 0.3s ease-out`}
          >
            <Text color="white" fontSize="sm" fontWeight="700" lineHeight={1}>
              ✓
            </Text>
          </Box>
        ) : (
          <Spinner size="md" color="brand.400" thickness="3px" speed="0.7s" />
        )}

        {/* Message */}
        <Text
          key={`${status}-${msgIndex}`}
          fontSize="sm"
          color="text.muted"
          fontWeight="500"
          animation={`${fadeIn} 0.3s ease-out`}
          textAlign="center"
        >
          {pool[msgIndex]}
        </Text>
      </VStack>
    </Flex>
  );
}
