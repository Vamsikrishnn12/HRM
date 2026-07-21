"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Avatar, Badge, Box, Button, Center, Flex, HStack, IconButton, Input, InputGroup,
  InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList,
  Popover, PopoverBody, PopoverContent, PopoverTrigger, Spinner, Text, VStack,
  useToast,
} from "@chakra-ui/react";
import {
  Bell, BellRing, CalendarDays, CheckCircle2, ChevronDown, Clock3, FileText,
  LogOut, Search, Settings, User, WalletCards, XCircle,
} from "lucide-react";
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

function notificationVisual(type: string) {
  const normalized = type.toUpperCase();
  if (normalized.includes("APPROVED")) return { icon: CheckCircle2, color: "#16845B", bg: "#E8F8F1" };
  if (normalized.includes("REJECTED") || normalized.includes("CANCELLED")) return { icon: XCircle, color: "#C53030", bg: "#FFF0F0" };
  if (normalized.includes("LEAVE") || normalized.includes("ATTENDANCE")) return { icon: CalendarDays, color: "#0B72E7", bg: "#EAF4FF" };
  if (normalized.includes("PAY") || normalized.includes("SALARY")) return { icon: WalletCards, color: "#7251B5", bg: "#F1ECFF" };
  if (normalized.includes("DOCUMENT")) return { icon: FileText, color: "#087F8C", bg: "#E7F8FA" };
  return { icon: Bell, color: "#0B72E7", bg: "#EAF4FF" };
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [deviceNotificationPermission, setDeviceNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [enablingDeviceNotifications, setEnablingDeviceNotifications] = useState(false);
  const [pushSubscriptionActive, setPushSubscriptionActive] = useState(false);
  const [pushConfigured, setPushConfigured] = useState<boolean | null>(null);
  const [testingPush, setTestingPush] = useState(false);
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
    setDeviceNotificationPermission("Notification" in window ? Notification.permission : "unsupported");
    const synchronizePush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
      try {
        const config = await notificationApi.getPushConfig();
        setPushConfigured(config.configured);
        if (!config.configured || !config.publicKey || Notification.permission !== "granted") {
          setPushSubscriptionActive(false);
          return;
        }
        const subscription = await ensurePushSubscription(config.publicKey);
        await notificationApi.subscribePush(subscription.toJSON());
        setPushSubscriptionActive(true);
      } catch {
        setPushSubscriptionActive(false);
      }
    };
    synchronizePush();
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const enableDeviceNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "Push notifications are not supported on this device", status: "warning", duration: 3500, isClosable: true });
      return;
    }
    setEnablingDeviceNotifications(true);
    try {
      const config = await notificationApi.getPushConfig();
      setPushConfigured(config.configured);
      if (!config.configured || !config.publicKey) {
        throw new Error("Push notification service is not configured yet");
      }
      const permission = await Notification.requestPermission();
      setDeviceNotificationPermission(permission);
      if (permission !== "granted") {
        throw new Error("Notification permission was not allowed");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await ensurePushSubscription(config.publicKey);
      await notificationApi.subscribePush(subscription.toJSON());
      setPushSubscriptionActive(true);
      await registration.showNotification("Connect HR notifications enabled", {
        body: "Important HR alerts will now reach this device, even when the app is closed.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "connect-hr-notifications-enabled",
        data: { actionUrl: "/employee/dashboard" },
      });
      toast({ title: "Mobile notifications enabled", status: "success", duration: 2500, isClosable: true });
    } catch (error: any) {
      toast({ title: "Could not enable notifications", description: error?.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setEnablingDeviceNotifications(false);
    }
  };

  const sendTestPush = async () => {
    setTestingPush(true);
    try {
      const result = await notificationApi.testPush();
      toast({
        title: result.delivered > 0 ? "Test notification sent" : "Notification was not delivered",
        description: result.delivered > 0 ? "Check your phone notification panel and sound settings." : "Please enable notifications again.",
        status: result.delivered > 0 ? "success" : "warning",
        duration: 3500,
        isClosable: true,
      });
    } catch (error: any) {
      toast({ title: "Test notification failed", description: error?.message, status: "error", duration: 4000, isClosable: true });
      setPushSubscriptionActive(false);
    } finally {
      setTestingPush(false);
    }
  };

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
    <Box as="header" h={{ base: "64px", md: "72px" }} bg="white" borderBottom="1px solid" borderColor="surface.border" position="sticky" top={0} zIndex={10} px={{ base: 3, md: 6 }} backdropFilter="blur(16px)" bgColor="rgba(255,255,255,0.9)" boxShadow="0 8px 28px -24px rgba(8,43,76,0.45)">
      <Flex h="100%" align="center" justify="space-between">
        <InputGroup maxW={{ base: "200px", md: "360px" }} size="sm" display={{ base: "none", sm: "block" }}>
          <InputLeftElement pointerEvents="none"><Search size={16} color="#708399" /></InputLeftElement>
          <Input placeholder="Search people, pages, or actions..." borderRadius="xl" bg="surface.bg" border="1px solid" borderColor="surface.border" _placeholder={{ color: "text.muted", fontSize: "sm" }} _hover={{ borderColor: "brand.200" }} _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 3px rgba(11,114,231,0.15)", bg: "white" }} fontWeight="500" />
        </InputGroup>

        <Flex align="center" gap={{ base: 1.5, md: 1 }} ml="auto">
          <Popover placement="bottom-end" onOpen={loadNotifications}>
            <PopoverTrigger>
              <Box position="relative">
                <IconButton
                  aria-label="Notifications"
                  icon={<Bell size={18} />}
                  variant="ghost"
                  color="text.muted"
                  size={{ base: "md", md: "sm" }}
                  borderRadius="xl"
                  bg={{ base: "surface.bg", md: "transparent" }}
                  _hover={{ bg: "brand.50", color: "brand.400" }}
                />
                {unreadCount > 0 && (
                  <Badge position="absolute" top="0" right="0" bgGradient="linear(135deg, #0B72E7, #20C997)" color="white" fontSize="9px" borderRadius="full" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" border="2px solid white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Box>
            </PopoverTrigger>
            <PopoverContent
              w={{ base: "calc(100vw - 24px)", sm: "400px" }}
              maxW="400px"
              maxH={{ base: "min(68vh, 440px)", md: "520px" }}
              borderRadius={{ base: "22px", md: "2xl" }}
              shadow="0 24px 65px -24px rgba(8,43,76,0.45)"
              border="1px solid"
              borderColor="surface.border"
              overflow="hidden"
              bg="white"
            >
              <PopoverBody p={0}>
                <Flex px={{ base: 4, md: 4.5 }} py={3.5} borderBottom="1px solid" borderColor="surface.border" align="center" justify="space-between" gap={3}>
                  <HStack spacing={3} minW={0}>
                    <Center w="36px" h="36px" borderRadius="12px" bg="brand.50" color="brand.500" flexShrink={0}>
                      <Bell size={18} />
                    </Center>
                    <Box minW={0}>
                      <HStack spacing={2}>
                        <Text fontWeight="800" fontSize="md" color="text.heading">Notifications</Text>
                        {unreadCount > 0 && <Badge px={2} py={0.5} borderRadius="full" colorScheme="blue" fontSize="10px">{unreadCount} new</Badge>}
                      </HStack>
                      <Text fontSize="11px" color="text.muted">Your latest Connect HR updates</Text>
                    </Box>
                  </HStack>
                  {unreadCount > 0 && <Button size="xs" variant="ghost" colorScheme="blue" onClick={markAllRead} flexShrink={0}>Mark read</Button>}
                </Flex>
                {(deviceNotificationPermission === "default" || (deviceNotificationPermission === "granted" && !pushSubscriptionActive)) && (
                  <Flex px={4} py={2.5} bg="linear-gradient(90deg, #EAF5FF 0%, #E9FBF6 100%)" align="center" justify="space-between" gap={3} borderBottom="1px solid" borderColor="surface.border">
                    <Flex align="center" gap={2} minW={0}>
                      <BellRing size={16} color="#075FC7" />
                      <Text fontSize="xs" color="text.body" fontWeight="600">Get alerts on this device</Text>
                    </Flex>
                    <Button size="xs" colorScheme="blue" onClick={enableDeviceNotifications} isLoading={enablingDeviceNotifications} flexShrink={0}>Enable</Button>
                  </Flex>
                )}
                {pushConfigured === false && (
                  <Box px={4} py={2.5} bg="orange.50" borderBottom="1px solid" borderColor="orange.100">
                    <Text fontSize="xs" color="orange.800" fontWeight="600">Mobile push is waiting for server configuration.</Text>
                  </Box>
                )}
                {pushSubscriptionActive && (
                  <Flex px={4} py={2} align="center" justify="space-between" bg="#F0FBF6" borderBottom="1px solid" borderColor="green.100">
                    <HStack spacing={2} color="green.700">
                      <BellRing size={14} />
                      <Text fontSize="11px" fontWeight="700">Mobile alerts active</Text>
                    </HStack>
                    <Button h="26px" px={2.5} fontSize="11px" borderRadius="full" variant="ghost" colorScheme="green" onClick={sendTestPush} isLoading={testingPush}>Test alert</Button>
                  </Flex>
                )}
                {loadingNotifications && notifications.length === 0 ? (
                  <Center py={10}><Spinner size="sm" color="brand.500" /></Center>
                ) : notifications.length === 0 ? (
                  <Center py={10} px={5} flexDirection="column" textAlign="center">
                    <Bell size={24} color="#94A3B8" />
                    <Text mt={3} fontWeight="600" color="text.heading">No notifications</Text>
                    <Text mt={1} fontSize="xs" color="text.muted">New leave requests and account updates will appear here.</Text>
                  </Center>
                ) : (
                  <VStack spacing={0} align="stretch" maxH={{ base: "300px", md: "360px" }} overflowY="auto" overscrollBehavior="contain">
                    {notifications.map((notification) => {
                      const visual = notificationVisual(notification.type);
                      const NoticeIcon = visual.icon;
                      return (
                        <Flex
                          key={notification.id}
                          px={4}
                          py={3}
                          gap={3}
                          bg={notification.isRead ? "white" : "#F8FBFF"}
                          _hover={{ bg: "surface.bg" }}
                          cursor={notification.actionUrl ? "pointer" : "default"}
                          borderBottom="1px solid"
                          borderColor="surface.border"
                          transition="background 0.18s ease"
                          onClick={() => openNotification(notification)}
                          position="relative"
                          align="flex-start"
                        >
                          {!notification.isRead && <Box position="absolute" left={0} top={3} bottom={3} w="3px" borderRightRadius="full" bg="brand.500" />}
                          <Center w="36px" h="36px" borderRadius="12px" bg={visual.bg} color={visual.color} flexShrink={0}>
                            <NoticeIcon size={17} />
                          </Center>
                          <Box minW={0} flex={1}>
                            <Flex align="flex-start" justify="space-between" gap={2}>
                              <Text fontSize="sm" lineHeight="1.35" color="text.heading" fontWeight={notification.isRead ? "650" : "750"}>{notification.title}</Text>
                              {!notification.isRead && <Box mt={1.5} w="7px" h="7px" borderRadius="full" bg="brand.500" flexShrink={0} />}
                            </Flex>
                            <Text fontSize="12px" lineHeight="1.45" color="text.body" mt={0.5} noOfLines={2}>{notification.message}</Text>
                            <HStack spacing={1} mt={1.5} color="text.muted">
                              <Clock3 size={11} />
                              <Text fontSize="10px" fontWeight="600">{relativeTime(notification.createdAt)}</Text>
                            </HStack>
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                )}
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <IconButton aria-label="Settings" icon={<Settings size={18} />} variant="ghost" color="text.muted" size="sm" borderRadius="xl" _hover={{ bg: "brand.50", color: "brand.400" }} display={{ base: "none", md: "flex" }} onClick={() => router.push(settingsPath)} />

          <Menu>
            <MenuButton as={Flex} align="center" gap={2} ml={{ base: 0, md: 2 }} px={{ base: 1, md: 2.5 }} py={1.5} borderRadius="xl" cursor="pointer" _hover={{ bg: "brand.50" }} transition="all 0.25s" border="1px solid" borderColor="transparent">
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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(Array.from(raw).map((char) => char.charCodeAt(0)));
}

async function ensurePushSubscription(publicKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  const desiredKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();

  if (subscription?.options.applicationServerKey && !keysMatch(subscription.options.applicationServerKey, desiredKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: desiredKey as BufferSource,
    });
  }
  return subscription;
}

function keysMatch(existing: ArrayBuffer, desired: Uint8Array): boolean {
  const current = new Uint8Array(existing);
  return current.length === desired.length && current.every((value, index) => value === desired[index]);
}
