"use client";

import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

function AppContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? "72px" : "260px";

  return (
    <Flex minH="100vh">
      <Sidebar />
      <Box
        flex={1}
        ml={sidebarWidth}
        transition="margin-left 0.2s ease"
        minW={0}
      >
        <Topbar />
        <Box as="main" p={{ base: 3, md: 6 }} maxW="1440px" mx="auto" w="100%">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppContent>{children}</AppContent>
    </SidebarProvider>
  );
}
