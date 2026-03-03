"use client";

import { Box, Flex, Text, VStack, IconButton } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback } from "react";
import { adminRoutes, type RouteItem } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => setCollapsed((p) => !p), []);

  return (
    <Box
      as="aside"
      w={collapsed ? "72px" : "260px"}
      minH="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="surface.border"
      shadow="sidebar"
      position="fixed"
      top={0}
      left={0}
      zIndex={20}
      transition="width 0.2s ease"
      display="flex"
      flexDirection="column"
    >
      {/* Logo area */}
      <Flex
        h="64px"
        align="center"
        justify={collapsed ? "center" : "flex-start"}
        px={collapsed ? 0 : 5}
        borderBottom="1px solid"
        borderColor="surface.border"
        flexShrink={0}
      >
        {!collapsed && (
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
        )}
        {collapsed && (
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
        )}
      </Flex>

      {/* Collapse toggle */}
      <Flex justify={collapsed ? "center" : "flex-end"} px={collapsed ? 0 : 2} py={2}>
        <IconButton
          aria-label="Toggle sidebar"
          icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          size="xs"
          variant="ghost"
          onClick={toggleCollapse}
          color="text.muted"
        />
      </Flex>

      {/* Navigation */}
      <VStack as="nav" spacing={1} px={2} flex={1} align="stretch">
        {adminRoutes.map((route: RouteItem) => {
          const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
          const Icon = route.icon;
          return (
            <Link key={route.href} href={route.href}>
              <Flex
                align="center"
                gap={3}
                px={3}
                py={2.5}
                borderRadius="lg"
                bg={isActive ? "brand.50" : "transparent"}
                color={isActive ? "brand.400" : "text.muted"}
                fontWeight={isActive ? "600" : "500"}
                fontSize="sm"
                transition="all 0.15s"
                _hover={{
                  bg: isActive ? "brand.50" : "surface.bg",
                  color: "brand.400",
                }}
                justify={collapsed ? "center" : "flex-start"}
                title={collapsed ? route.label : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                {!collapsed && <Text>{route.label}</Text>}
              </Flex>
            </Link>
          );
        })}
      </VStack>

      {/* Logout */}
      <Box px={2} pb={4} flexShrink={0}>
        <Flex
          as="button"
          align="center"
          gap={3}
          px={3}
          py={2.5}
          borderRadius="lg"
          color="text.muted"
          fontWeight="500"
          fontSize="sm"
          transition="all 0.15s"
          _hover={{ bg: "#FEE7E7", color: "#C41E3A" }}
          onClick={logout}
          w="100%"
          justify={collapsed ? "center" : "flex-start"}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} aria-label="Logout" />
          {!collapsed && <Text>Logout</Text>}
        </Flex>
      </Box>
    </Box>
  );
}
