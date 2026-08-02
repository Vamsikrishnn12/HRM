"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Download, Share2, Smartphone, SquarePlus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const DISMISSED_AT_KEY = "connect-hr-install-dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

const isIosDevice = () =>
  /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function PWAInstallPrompt() {
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const instructions = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const ios = isIosDevice();
    setIsIos(ios);
    const timer = window.setTimeout(() => {
      if (ios) setVisible(true);
    }, 1200);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      window.localStorage.removeItem(DISMISSED_AT_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
    instructions.onClose();
  };

  const install = async () => {
    if (isIos || !installEvent) {
      instructions.onOpen();
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      toast({ title: "Connect HR installed", status: "success" });
    }
    setInstallEvent(null);
  };

  if (!visible || isStandalone()) return null;

  return (
    <>
      <Box
        position="fixed"
        zIndex={99}
        left={{ base: 3, md: "auto" }}
        right={{ base: 3, md: 6 }}
        bottom={{ base: "calc(82px + env(safe-area-inset-bottom))", md: 6 }}
        w={{ base: "auto", md: "390px" }}
        bg="white"
        border="1px solid"
        borderColor="brand.100"
        borderRadius="2xl"
        boxShadow="0 22px 60px -24px rgba(7,53,104,.55)"
        overflow="hidden"
      >
        <Box h="3px" bgGradient="linear(to-r, brand.500, accent.400)" />
        <Flex p={4} gap={3} align="flex-start">
          <Flex w={10} h={10} flexShrink={0} align="center" justify="center" borderRadius="xl" bg="brand.50" color="brand.600">
            <Smartphone size={20} />
          </Flex>
          <Box flex={1} minW={0}>
            <Text fontWeight="800" fontSize="sm" color="text.heading">
              {isIos ? "Install Connect HR on iPhone" : "Install Connect HR"}
            </Text>
            <Text mt={1} fontSize="xs" color="text.muted" lineHeight="1.5">
              Add it to your Home Screen for quick, full-screen access.
            </Text>
            <Button mt={3} size="sm" colorScheme="blue" leftIcon={<Download size={14} />} onClick={install}>
              {isIos ? "Show iPhone steps" : "Install app"}
            </Button>
          </Box>
          <CloseButton size="sm" color="gray.500" onClick={dismiss} aria-label="Dismiss install suggestion" />
        </Flex>
      </Box>

      <Modal isOpen={instructions.isOpen} onClose={instructions.onClose} isCentered size="sm">
        <ModalOverlay bg="rgba(6,31,58,.58)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" mx={4}>
          <ModalHeader color="text.heading">Install on iPhone or iPad</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="text.muted" mb={5}>
              Open Connect HR in Safari, then follow these steps:
            </Text>
            <VStack spacing={4} align="stretch">
              <InstallStep number="1" icon={<Share2 size={18} />} text="Tap Safari’s Share button." />
              <InstallStep number="2" icon={<SquarePlus size={18} />} text="Choose Add to Home Screen." />
              <InstallStep number="3" icon={<Smartphone size={18} />} text="Turn on Open as Web App, then tap Add." />
            </VStack>
            <Text mt={5} fontSize="xs" color="orange.700" bg="orange.50" p={3} borderRadius="lg">
              If Add to Home Screen is hidden, scroll to the bottom of the Share menu, tap Edit Actions, and enable it.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={instructions.onClose}>Got it</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function InstallStep({ number, icon, text }: { number: string; icon: React.ReactNode; text: string }) {
  return (
    <HStack spacing={3} p={3} bg="surface.bg" borderRadius="xl" align="center">
      <Flex w={9} h={9} align="center" justify="center" borderRadius="lg" bg="white" color="brand.600" border="1px solid" borderColor="brand.100">
        {icon}
      </Flex>
      <Text fontSize="sm" color="text.body" flex={1}><strong>{number}.</strong> {text}</Text>
    </HStack>
  );
}
