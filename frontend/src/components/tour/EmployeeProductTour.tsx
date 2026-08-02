"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Button, Flex, Progress, Text } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/api/profile.api";

const steps = [
  {
    target: "employee-dashboard",
    title: "Welcome to Connect HR",
    description: "Your dashboard gives you a quick view of attendance, upcoming holidays, payslips, announcements, and important updates.",
  },
  {
    target: "employee-personal-details",
    title: "Complete Personal Details",
    description: "Use Personal Details to provide contact, address, emergency, education, experience, bank, identity, and onboarding document information.",
  },
  {
    target: "employee-attendance",
    title: "Attendance and Punching",
    description: "Punch in when work starts and punch out after completing the required hours. Review daily work time, breaks, late arrival, and attendance status here.",
  },
  {
    target: "employee-holidays",
    title: "Holiday Calendar",
    description: "Check national, state, and organization holidays. Your organization may modify the calendar based on business requirements.",
  },
  {
    target: "employee-leave",
    title: "Apply for Leave",
    description: "Open Leave and select the leave type. You can request a Full Day, Half Day, or Permission when enabled, choose the date, enter the reason, and submit it for approval.",
  },
  {
    target: "employee-payroll",
    title: "Payslips and Salary",
    description: "After payroll is released, view and securely download your monthly payslips from the Payroll section.",
  },
  {
    target: "employee-profile",
    title: "Profile and Settings",
    description: "Review your work and personal information, change your password, and restart this product tour whenever you need help.",
  },
];

type HighlightRect = { top: number; left: number; width: number; height: number };

export default function EmployeeProductTour() {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const storageKey = user ? `connect_hr_tour_completed_${user.id}` : "";

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  useEffect(() => {
    const listener = () => start();
    window.addEventListener("employee-tour:start", listener);
    return () => window.removeEventListener("employee-tour:start", listener);
  }, [start]);

  useEffect(() => {
    if (user?.role !== "employee" || user.employeeTourCompleted !== false || !storageKey) return;
    if (localStorage.getItem(storageKey) === "true") return;
    const timer = window.setTimeout(start, 900);
    return () => window.clearTimeout(timer);
  }, [user?.role, user?.employeeTourCompleted, storageKey, start]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const element = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-tour="${steps[stepIndex].target}"]`),
      ).find((candidate) => {
        const candidateRect = candidate.getBoundingClientRect();
        return candidateRect.width > 0 && candidateRect.height > 0;
      });
      if (!element) return setRect(null);
      element.scrollIntoView({ block: "nearest" });
      const bounds = element.getBoundingClientRect();
      setRect({ top: bounds.top - 5, left: bounds.left - 5, width: bounds.width + 10, height: bounds.height + 10 });
    };
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [active, stepIndex]);

  const finish = async () => {
    setActive(false);
    if (storageKey) localStorage.setItem(storageKey, "true");
    await profileApi.setTourCompleted(true).catch(() => undefined);
  };

  if (!active || user?.role !== "employee") return null;
  const step = steps[stepIndex];
  const last = stepIndex === steps.length - 1;

  return (
    <Box position="fixed" inset={0} zIndex={2000} pointerEvents="none" aria-live="polite">
      {rect ? (
        <Box
          position="fixed"
          top={`${rect.top}px`}
          left={`${rect.left}px`}
          w={`${rect.width}px`}
          h={`${rect.height}px`}
          border="3px solid"
          borderColor="accent.300"
          borderRadius="xl"
          boxShadow="0 0 0 9999px rgba(4, 20, 38, 0.70), 0 0 0 6px rgba(32, 201, 151, 0.22)"
          transition="all 0.25s ease"
        />
      ) : (
        <Box position="fixed" inset={0} bg="rgba(4, 20, 38, 0.72)" />
      )}

      <Box
        position="fixed"
        right={{ base: 4, md: 7 }}
        bottom={{ base: "calc(82px + env(safe-area-inset-bottom))", lg: 7 }}
        left={{ base: 4, md: "auto" }}
        w={{ base: "auto", md: "410px" }}
        bg="white"
        borderRadius="2xl"
        boxShadow="0 24px 70px rgba(0, 20, 50, 0.30)"
        overflow="hidden"
        pointerEvents="auto"
      >
        <Progress value={((stepIndex + 1) / steps.length) * 100} size="xs" colorScheme="teal" />
        <Box p={{ base: 5, md: 6 }}>
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Flex w="42px" h="42px" borderRadius="xl" bg="brand.50" color="brand.500" align="center" justify="center"><Compass size={21} /></Flex>
            <Flex align="center" gap={2}>
              <Badge colorScheme="blue" borderRadius="full" px={2.5} py={1}>Step {stepIndex + 1} of {steps.length}</Badge>
              <Button aria-label="Skip product tour" variant="ghost" size="sm" minW="34px" p={0} onClick={() => void finish()}><X size={17} /></Button>
            </Flex>
          </Flex>
          <Text fontSize="lg" fontWeight="800" color="text.heading" mb={2}>{step.title}</Text>
          <Text fontSize="sm" color="text.muted" lineHeight="1.7" minH={{ md: "72px" }}>{step.description}</Text>
          <Flex justify="space-between" align="center" mt={5} gap={3}>
            <Button variant="ghost" size="sm" onClick={() => void finish()}>Skip Tour</Button>
            <Flex gap={2}>
              <Button leftIcon={<ArrowLeft size={15} />} variant="outline" size="sm" isDisabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>Back</Button>
              <Button
                rightIcon={last ? <Check size={15} /> : <ArrowRight size={15} />}
                colorScheme={last ? "teal" : "blue"}
                size="sm"
                onClick={() => last ? void finish() : setStepIndex((value) => value + 1)}
              >{last ? "Finish" : "Next"}</Button>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
