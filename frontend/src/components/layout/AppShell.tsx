"use client";

import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <Flex minH="100vh">
      <Sidebar />
      {/* Main content area — offset by sidebar width */}
      <Box flex={1} ml={{ base: "72px", lg: "260px" }} transition="margin-left 0.2s ease">
        <Topbar />
        <Box as="main" p={6} maxW="1440px" mx="auto">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
