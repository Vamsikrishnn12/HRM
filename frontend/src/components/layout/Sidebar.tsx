"use client";

import { Box, Flex, Text, VStack, IconButton, Collapse } from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { adminRoutes, employeeRoutes, type RouteItem } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

function NavItem({
  route,
  pathname,
  collapsed,
}: {
  route: RouteItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = pathname === route.href || pathname.startsWith(route.href + "/");
  const Icon = route.icon;
  return (
    <Link href={route.href}>
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
        _hover={{ bg: isActive ? "brand.50" : "surface.bg", color: "brand.400" }}
        justify={collapsed ? "center" : "flex-start"}
        title={collapsed ? route.label : undefined}
      >
        <Icon size={20} aria-hidden="true" />
        {!collapsed && <Text>{route.label}</Text>}
      </Flex>
    </Link>
  );
}

function NavGroup({
  route,
  pathname,
  collapsed,
}: {
  route: RouteItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isChildActive = route.children?.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
  );
  const [open, setOpen] = useState(!!isChildActive);
  const Icon = route.icon;

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (collapsed) {
    return (
      <Box>
        <Link href={route.href}>
          <Flex
            align="center"
            justify="center"
            px={3}
            py={2.5}
            borderRadius="lg"
            bg={isChildActive ? "brand.50" : "transparent"}
            color={isChildActive ? "brand.400" : "text.muted"}
            transition="all 0.15s"
            _hover={{ bg: "surface.bg", color: "brand.400" }}
            title={route.label}
          >
            <Icon size={20} />
          </Flex>
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      <Flex
        as="button"
        w="100%"
        align="center"
        gap={3}
        px={3}
        py={2.5}
        borderRadius="lg"
        bg={isChildActive && !open ? "brand.50" : "transparent"}
        color={isChildActive ? "brand.400" : "text.muted"}
        fontWeight={isChildActive ? "600" : "500"}
        fontSize="sm"
        transition="all 0.15s"
        _hover={{ bg: "surface.bg", color: "brand.400" }}
        onClick={() => setOpen((p) => !p)}
      >
        <Icon size={20} aria-hidden="true" />
        <Text flex={1} textAlign="left">
          {route.label}
        </Text>
        <Box
          transform={open ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        >
          <ChevronDown size={16} />
        </Box>
      </Flex>

      <Collapse in={open} animateOpacity>
        <VStack spacing={0.5} pl={6} mt={1} align="stretch">
          {route.children?.map((child) => {
            const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
            const ChildIcon = child.icon;
            return (
              <Link key={child.href} href={child.href}>
                <Flex
                  align="center"
                  gap={2.5}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  bg={childActive ? "brand.50" : "transparent"}
                  color={childActive ? "brand.400" : "text.muted"}
                  fontWeight={childActive ? "600" : "500"}
                  fontSize="13px"
                  transition="all 0.15s"
                  _hover={{ bg: "surface.bg", color: "brand.400" }}
                >
                  <ChildIcon size={16} aria-hidden="true" />
                  <Text>{child.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
      </Collapse>
    </Box>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { collapsed, toggleCollapse } = useSidebar();

  const routes = user?.role === "employee" ? employeeRoutes : adminRoutes;

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
        {routes.map((route: RouteItem) =>
          route.children ? (
            <NavGroup key={route.href} route={route} pathname={pathname} collapsed={collapsed} />
          ) : (
            <NavItem key={route.href} route={route} pathname={pathname} collapsed={collapsed} />
          ),
        )}
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
