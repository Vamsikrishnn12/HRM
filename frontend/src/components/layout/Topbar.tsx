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
      h="68px"
      bg="white"
      borderBottom="1px solid"
      borderColor="surface.border"
      position="sticky"
      top={0}
      zIndex={10}
      px={{ base: 4, md: 6 }}
      backdropFilter="blur(12px)"
      bgColor="rgba(255,255,255,0.9)"
    >
      <Flex h="100%" align="center" justify="space-between">
        {/* Search */}
        <InputGroup maxW={{ base: "200px", md: "360px" }} size="sm" display={{ base: "none", sm: "block" }}>
          <InputLeftElement pointerEvents="none">
            <Search size={16} color="#7C7F99" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder="Search anything..."
            borderRadius="xl"
            bg="surface.bg"
            border="1px solid"
            borderColor="surface.border"
            _placeholder={{ color: "text.muted", fontSize: "sm" }}
            _hover={{ borderColor: "brand.200" }}
            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 3px rgba(117,72,185,0.15)", bg: "white" }}
            fontWeight="500"
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
                  borderRadius="xl"
                  _hover={{ bg: "brand.50", color: "brand.400" }}
                />
                <Badge
                  position="absolute"
                  top="1"
                  right="1"
                  bgGradient="linear(135deg, #7548b9, #359de9)"
                  color="white"
                  fontSize="9px"
                  borderRadius="full"
                  minW="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px solid white"
                >
                  3
                </Badge>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="340px" borderRadius="2xl" shadow="elevated" border="1px solid" borderColor="surface.border">
              <PopoverBody p={0}>
                <Box px={4} py={3} borderBottom="1px solid" borderColor="surface.border">
                  <Text fontWeight="700" fontSize="sm" color="text.heading">
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
                      _hover={{ bg: "brand.50" }}
                      cursor="pointer"
                      borderBottom={i < 2 ? "1px solid" : "none"}
                      borderColor="surface.border"
                      transition="all 0.2s"
                    >
                      <Text fontSize="sm" color="text.body" fontWeight="500">
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
            borderRadius="xl"
            _hover={{ bg: "brand.50", color: "brand.400" }}
            display={{ base: "none", md: "flex" }}
          />

          {/* Settings */}
          <IconButton
            aria-label="Settings"
            icon={<Settings size={18} />}
            variant="ghost"
            color="text.muted"
            size="sm"
            borderRadius="xl"
            _hover={{ bg: "brand.50", color: "brand.400" }}
            display={{ base: "none", md: "flex" }}
          />

          {/* Profile */}
          <Menu>
            <MenuButton
              as={Flex}
              align="center"
              gap={2}
              ml={2}
              px={2.5}
              py={1.5}
              borderRadius="xl"
              cursor="pointer"
              _hover={{ bg: "brand.50" }}
              transition="all 0.25s cubic-bezier(.4,0,.2,1)"
              border="1px solid"
              borderColor="transparent"
            >
              <Flex align="center" gap={2}>
                <Avatar
                  size="sm"
                  name={user ? `${user.firstName} ${user.lastName}` : "User"}
                  bg="brand.400"
                  color="white"
                  fontSize="xs"
                  border="2px solid"
                  borderColor="brand.100"
                />
                <Box display={{ base: "none", md: "block" }}>
                  <Text fontSize="sm" fontWeight="700" color="text.heading" lineHeight="1.2">
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </Text>
                  <Text fontSize="xs" color="text.muted" lineHeight="1.2" textTransform="capitalize" fontWeight="500">
                    {user?.role ?? "—"}
                  </Text>
                </Box>
                <ChevronDown size={14} color="#7C7F99" />
              </Flex>
            </MenuButton>
            <MenuList borderRadius="xl" shadow="elevated" border="1px solid" borderColor="surface.border" py={2} minW="200px">
              <MenuItem fontSize="sm" icon={<User size={16} />} fontWeight="500" borderRadius="lg" mx={1.5}>
                My Profile
              </MenuItem>
              <MenuItem fontSize="sm" icon={<Settings size={16} />} fontWeight="500" borderRadius="lg" mx={1.5}>
                Account Settings
              </MenuItem>
              <MenuDivider borderColor="surface.border" />
              <MenuItem fontSize="sm" icon={<LogOut size={16} />} color="#C41E3A" onClick={logout} fontWeight="500" borderRadius="lg" mx={1.5}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
