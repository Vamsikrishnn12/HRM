"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CloseButton, Flex, Text } from "@chakra-ui/react";
import { RefreshCw, Sparkles } from "lucide-react";

const VERSION_STORAGE_KEY = "connect-hr-app-version";

type AppVersion = {
  version: string;
  builtAt?: string;
};

export default function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [updating, setUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const notifiedVersionRef = useRef("");

  const announceUpdate = useCallback((version: string) => {
    setLatestVersion((current) => version === "new" && current ? current : version);
    setUpdateAvailable(true);

    if (
      notifiedVersionRef.current !== version &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      notifiedVersionRef.current = version;
      const notification = new Notification("Connect HR update available", {
        body: "A newer version is ready. Open Connect HR and tap Update now.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `connect-hr-update-${version}`,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, []);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(`/app-version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const current = await response.json() as AppVersion;
      if (!current.version) return;

      const storedVersion = window.localStorage.getItem(VERSION_STORAGE_KEY);
      if (!storedVersion) {
        window.localStorage.setItem(VERSION_STORAGE_KEY, current.version);
      } else if (storedVersion !== current.version) {
        announceUpdate(current.version);
      }
    } catch {
      // Version checks are best-effort and must never interrupt the HR workflow.
    }
  }, [announceUpdate]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let versionTimer: number | undefined;
    let registrationTimer: number | undefined;

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      registrationRef.current = registration;
      if (registration.waiting && navigator.serviceWorker.controller) {
        announceUpdate("new");
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            announceUpdate("new");
          }
        });
      });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        watchRegistration(registration);
        await checkVersion();
        versionTimer = window.setInterval(checkVersion, 5 * 60_000);
        registrationTimer = window.setInterval(() => registration.update().catch(() => undefined), 60 * 60_000);
      } catch (error) {
        console.error("Connect HR service worker registration failed", error);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") checkVersion();
    };
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      if (versionTimer) window.clearInterval(versionTimer);
      if (registrationTimer) window.clearInterval(registrationTimer);
    };
  }, [announceUpdate, checkVersion]);

  const applyUpdate = async () => {
    setUpdating(true);
    if (latestVersion && latestVersion !== "new") {
      window.localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
    }

    const registration = registrationRef.current;
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
      window.setTimeout(() => window.location.reload(), 2500);
      return;
    }

    await registration?.update().catch(() => undefined);
    window.location.reload();
  };

  const dismissUpdate = () => {
    if (latestVersion && latestVersion !== "new") {
      window.localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
    }
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <Box
      position="fixed"
      zIndex={100}
      left={{ base: 3, md: "auto" }}
      right={{ base: 3, md: 6 }}
      bottom={{ base: "calc(82px + env(safe-area-inset-bottom))", md: 6 }}
      w={{ base: "auto", md: "390px" }}
      bg="rgba(7, 53, 104, 0.97)"
      color="white"
      borderRadius="2xl"
      border="1px solid rgba(255,255,255,0.16)"
      boxShadow="0 24px 60px -20px rgba(7,53,104,0.7)"
      backdropFilter="blur(18px)"
      overflow="hidden"
    >
      <Box h="3px" bgGradient="linear(to-r, brand.300, accent.300)" />
      <Flex p={4} gap={3} align="flex-start">
        <Flex w={10} h={10} flexShrink={0} align="center" justify="center" borderRadius="xl" bg="rgba(32,201,151,0.18)" color="accent.200">
          <Sparkles size={19} />
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontWeight="800" fontSize="sm">A new Connect HR update is ready</Text>
          <Text mt={1} fontSize="xs" color="whiteAlpha.800" lineHeight="1.5">
            Update now to get the latest improvements and fixes. Your work will remain safe.
          </Text>
          <Button mt={3} size="sm" bg="white" color="navy.600" leftIcon={<RefreshCw size={14} />} _hover={{ bg: "brand.50" }} onClick={applyUpdate} isLoading={updating}>
            Update now
          </Button>
        </Box>
        <CloseButton size="sm" color="whiteAlpha.800" onClick={dismissUpdate} aria-label="Dismiss update notice" />
      </Flex>
    </Box>
  );
}
