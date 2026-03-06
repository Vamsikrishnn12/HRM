"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/layout/AppShell";
import AuthLoader from "@/components/ui/AuthLoader";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, authStatus } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      toast({
        title: "Access denied",
        description: "Please log in to continue.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      router.replace("/login");
      return;
    }
    if (user?.role !== "employee") {
      toast({
        title: "Unauthorized",
        description: "You don't have employee access.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, user, router, toast]);

  if (isLoading) {
    return <AuthLoader status={authStatus} />;
  }

  if (!isAuthenticated || user?.role !== "employee") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
