"use client";

import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileBottomNav from "./MobileBottomNav";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

function AppContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const sidebarWidth = isMobile ? "0px" : collapsed ? "76px" : "272px";

  return (
    <Flex minH="100vh" bg="surface.bg">
      <Sidebar />
      <Box
        flex={1}
        ml={sidebarWidth}
        transition="margin-left 0.3s cubic-bezier(.4,0,.2,1)"
        minW={0}
      >
        <Topbar />
        <Box as="main" p={{ base: 4, md: 6, lg: 7 }} pb={{ base: "calc(88px + env(safe-area-inset-bottom))", lg: 7 }} maxW="1500px" mx="auto" w="100%">
          {children}
        </Box>
      </Box>
      <MobileBottomNav />
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
