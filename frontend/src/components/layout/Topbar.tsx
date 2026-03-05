"use client";

import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Badge,
} from "@chakra-ui/react";
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <Box
      as="header"
      h="64px"
      bg="white"
      borderBottom="1px solid"
      borderColor="surface.border"
      position="sticky"
      top={0}
      zIndex={10}
      px={6}
    >
      <Flex h="100%" align="center" justify="space-between">
        {/* Search */}
        <InputGroup maxW="400px" size="sm">
          <InputLeftElement pointerEvents="none">
            <Search size={16} color="#516079" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder="Search anything..."
            borderRadius="lg"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            _placeholder={{ color: "text.muted", fontSize: "sm" }}
            _focus={{ borderColor: "brand.400", bg: "white" }}
          />
        </InputGroup>

        {/* Right actions */}
        <Flex align="center" gap={1}>
          {/* Notifications */}
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Box position="relative">
                <IconButton
                  aria-label="Notifications"
                  icon={<Bell size={18} />}
                  variant="ghost"
                  color="text.muted"
                  size="sm"
                />
                <Badge
                  position="absolute"
                  top="1"
                  right="1"
                  bg="#C41E3A"
                  color="white"
                  fontSize="9px"
                  borderRadius="full"
                  minW="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  3
                </Badge>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="320px" borderRadius="xl" shadow="lg" border="1px solid" borderColor="surface.border">
              <PopoverBody p={0}>
                <Box px={4} py={3} borderBottom="1px solid" borderColor="surface.border">
                  <Text fontWeight="600" fontSize="sm" color="text.heading">
                    Notifications
                  </Text>
                </Box>
                <VStack spacing={0} align="stretch">
                  {[
                    { text: "New leave request from Sarah Johnson", time: "2 min ago" },
                    { text: "Payroll for Feb 2026 processed", time: "1 hour ago" },
                    { text: "3 employees marked late today", time: "3 hours ago" },
                  ].map((n, i) => (
                    <Box
                      key={i}
                      px={4}
                      py={3}
                      _hover={{ bg: "surface.bg" }}
                      cursor="pointer"
                      borderBottom={i < 2 ? "1px solid" : "none"}
                      borderColor="surface.border"
                    >
                      <Text fontSize="sm" color="text.body">
                        {n.text}
                      </Text>
                      <Text fontSize="xs" color="text.muted" mt={0.5}>
                        {n.time}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* Help */}
          <IconButton
            aria-label="Help"
            icon={<HelpCircle size={18} />}
            variant="ghost"
            color="text.muted"
            size="sm"
          />

          {/* Settings */}
          <IconButton
            aria-label="Settings"
            icon={<Settings size={18} />}
            variant="ghost"
            color="text.muted"
            size="sm"
          />

          {/* Profile */}
          <Menu>
            <MenuButton
              as={Flex}
              align="center"
              gap={2}
              ml={2}
              px={2}
              py={1}
              borderRadius="lg"
              cursor="pointer"
              _hover={{ bg: "surface.bg" }}
              transition="all 0.15s"
            >
              <Flex align="center" gap={2}>
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : "User"}
                  bg="brand.400"
                  color="white"
                  fontSize="xs"
                />
                <Box display={{ base: "none", md: "block" }}>
                  <Text fontSize="sm" fontWeight="600" color="text.heading" lineHeight="1.2">
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </Text>
                  <Text fontSize="xs" color="text.muted" lineHeight="1.2" textTransform="capitalize">
                    {user?.role ?? "—"}
                  </Text>
                </Box>
                <ChevronDown size={14} color="#516079" />
              </Flex>
            </MenuButton>
            <MenuList borderRadius="xl" shadow="lg" border="1px solid" borderColor="surface.border" py={1} minW="180px">
              <MenuItem fontSize="sm" icon={<User size={16} />}>
                My Profile
              </MenuItem>
              <MenuItem fontSize="sm" icon={<Settings size={16} />}>
                Account Settings
              </MenuItem>
              <MenuDivider borderColor="surface.border" />
              <MenuItem fontSize="sm" icon={<LogOut size={16} />} color="#C41E3A" onClick={logout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
