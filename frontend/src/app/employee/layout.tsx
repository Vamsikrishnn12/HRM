"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@chakra-ui/react";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      toast({
        title: "Access denied",
        description: "Please log in to continue.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      router.replace("/login");
      return;
    }
    if (user?.role !== "employee") {
      toast({
        title: "Unauthorized",
        description: "You don't have employee access.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, user, router, toast]);

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="surface.bg">
        <Flex direction="column" align="center" gap={3}>
          <Spinner size="lg" color="brand.400" thickness="3px" />
          <Text color="text.muted" fontSize="sm">
            Loading...
          </Text>
        </Flex>
      </Flex>
    );
  }

  if (!isAuthenticated || user?.role !== "employee") {
    return null;
  }

  return (
    <Box minH="100vh" bg="surface.bg">
      {/* Simple topbar for employee */}
      <Flex
        h="64px"
        bg="white"
        borderBottom="1px solid"
        borderColor="surface.border"
        px={6}
        align="center"
        justify="space-between"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex align="center" gap={2}>
          <Flex
            w={8}
            h={8}
            borderRadius="lg"
            bgGradient="linear(to-br, brand.400, brand.700)"
            align="center"
            justify="center"
          >
            <Text fontSize="sm" fontWeight="800" color="white">
              HR
            </Text>
          </Flex>
          <Text fontSize="lg" fontWeight="700" color="text.heading">
            HRMS
          </Text>
        </Flex>
        <Flex
          as="button"
          align="center"
          gap={2}
          px={3}
          py={1.5}
          borderRadius="lg"
          _hover={{ bg: "surface.bg" }}
          onClick={logout}
        >
          <Text fontSize="sm" fontWeight="500" color="text.muted">
            Logout
          </Text>
        </Flex>
      </Flex>
      <Box as="main" p={6} maxW="1200px" mx="auto">
        {children}
      </Box>
    </Box>
  );
}
