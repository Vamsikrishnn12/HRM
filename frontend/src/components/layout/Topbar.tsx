"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar, Badge, Box, Button, Center, Flex, IconButton, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList,
  Popover, PopoverBody, PopoverContent, PopoverTrigger, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { Bell, ChevronDown, LogOut, Search, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { notificationApi, type NotificationItem } from "@/api";

function relativeTime(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const result = await notificationApi.list();
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      await notificationApi.markRead(notification.id).catch(() => undefined);
    }
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    await notificationApi.markAllRead().catch(() => loadNotifications());
  };

  const isEmployee = user?.role === "employee";
  const settingsPath = isEmployee ? "/employee/profile" : "/admin/settings";
  const profilePath = isEmployee ? "/employee/profile" : "/admin/settings";

  return (
    <Box as="header" h="72px" bg="white" borderBottom="1px solid" borderColor="surface.border" position="sticky" top={0} zIndex={10} px={{ base: 4, md: 6 }} backdropFilter="blur(12px)" bgColor="rgba(255,255,255,0.86)" boxShadow="0 1px 0 rgba(8,43,76,0.03)">
      <Flex h="100%" align="center" justify="space-between">
        <InputGroup maxW={{ base: "200px", md: "360px" }} size="sm" display={{ base: "none", sm: "block" }}>
          <InputLeftElement pointerEvents="none"><Search size={16} color="#708399" /></InputLeftElement>
          <Input placeholder="Search people, pages, or actions..." borderRadius="xl" bg="surface.bg" border="1px solid" borderColor="surface.border" _placeholder={{ color: "text.muted", fontSize: "sm" }} _hover={{ borderColor: "brand.200" }} _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 3px rgba(11,114,231,0.15)", bg: "white" }} fontWeight="500" />
        </InputGroup>

        <Flex align="center" gap={1}>
          <Popover placement="bottom-end" onOpen={loadNotifications}>
            <PopoverTrigger>
              <Box position="relative">
                <IconButton aria-label="Notifications" icon={<Bell size={18} />} variant="ghost" color="text.muted" size="sm" borderRadius="xl" _hover={{ bg: "brand.50", color: "brand.400" }} />
                {unreadCount > 0 && (
                  <Badge position="absolute" top="0" right="0" bgGradient="linear(135deg, #0B72E7, #20C997)" color="white" fontSize="9px" borderRadius="full" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" border="2px solid white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Box>
            </PopoverTrigger>
            <PopoverContent w={{ base: "calc(100vw - 24px)", sm: "380px" }} maxH="480px" borderRadius="2xl" shadow="elevated" border="1px solid" borderColor="surface.border" overflow="hidden">
              <PopoverBody p={0}>
                <Flex px={4} py={3} borderBottom="1px solid" borderColor="surface.border" align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="700" fontSize="sm" color="text.heading">Notifications</Text>
                    <Text fontSize="xs" color="text.muted">{unreadCount} unread</Text>
                  </Box>
                  {unreadCount > 0 && <Button size="xs" variant="ghost" colorScheme="blue" onClick={markAllRead}>Mark all read</Button>}
                </Flex>
                {loadingNotifications && notifications.length === 0 ? (
                  <Center py={10}><Spinner size="sm" color="brand.500" /></Center>
                ) : notifications.length === 0 ? (
                  <Center py={10} px={5} flexDirection="column" textAlign="center">
                    <Bell size={24} color="#94A3B8" />
                    <Text mt={3} fontWeight="600" color="text.heading">No notifications</Text>
                    <Text mt={1} fontSize="xs" color="text.muted">New leave requests and account updates will appear here.</Text>
                  </Center>
                ) : (
                  <VStack spacing={0} align="stretch" maxH="390px" overflowY="auto">
                    {notifications.map((notification) => (
                      <Box key={notification.id} px={4} py={3.5} bg={notification.isRead ? "white" : "brand.50"} _hover={{ bg: "surface.bg" }} cursor={notification.actionUrl ? "pointer" : "default"} borderBottom="1px solid" borderColor="surface.border" transition="all 0.2s" onClick={() => openNotification(notification)} position="relative">
                        {!notification.isRead && <Box position="absolute" left="8px" top="19px" w="6px" h="6px" borderRadius="full" bg="brand.500" />}
                        <Text fontSize="sm" color="text.heading" fontWeight={notification.isRead ? "600" : "700"}>{notification.title}</Text>
                        <Text fontSize="xs" color="text.body" mt={1}>{notification.message}</Text>
                        <Text fontSize="xs" color="text.muted" mt={1}>{relativeTime(notification.createdAt)}</Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <IconButton aria-label="Settings" icon={<Settings size={18} />} variant="ghost" color="text.muted" size="sm" borderRadius="xl" _hover={{ bg: "brand.50", color: "brand.400" }} display={{ base: "none", md: "flex" }} onClick={() => router.push(settingsPath)} />

          <Menu>
            <MenuButton as={Flex} align="center" gap={2} ml={2} px={2.5} py={1.5} borderRadius="xl" cursor="pointer" _hover={{ bg: "brand.50" }} transition="all 0.25s" border="1px solid" borderColor="transparent">
              <Flex align="center" gap={2}>
                <Avatar size="sm" name={user ? `${user.firstName} ${user.lastName}` : "User"} bg="brand.400" color="white" fontSize="xs" border="2px solid" borderColor="brand.100" />
                <Box display={{ base: "none", md: "block" }}>
                  <Text fontSize="sm" fontWeight="700" color="text.heading" lineHeight="1.2">{user ? `${user.firstName} ${user.lastName}` : "User"}</Text>
                  <Text fontSize="xs" color="text.muted" lineHeight="1.2" textTransform="capitalize" fontWeight="500">{user?.role ?? "—"}</Text>
                </Box>
                <ChevronDown size={14} color="#708399" />
              </Flex>
            </MenuButton>
            <MenuList borderRadius="xl" shadow="elevated" border="1px solid" borderColor="surface.border" py={2} minW="200px">
              <MenuItem fontSize="sm" icon={<User size={16} />} fontWeight="500" borderRadius="lg" mx={1.5} onClick={() => router.push(profilePath)}>My Profile</MenuItem>
              <MenuItem fontSize="sm" icon={<Settings size={16} />} fontWeight="500" borderRadius="lg" mx={1.5} onClick={() => router.push(settingsPath)}>Account Settings</MenuItem>
              <MenuDivider borderColor="surface.border" />
              <MenuItem fontSize="sm" icon={<LogOut size={16} />} color="#C41E3A" onClick={logout} fontWeight="500" borderRadius="lg" mx={1.5}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
}
