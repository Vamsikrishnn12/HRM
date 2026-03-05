"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/layout/AppShell";
import AuthLoader from "@/components/ui/AuthLoader";
import { useToast } from "@chakra-ui/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    if (user?.role !== "admin") {
      toast({
        title: "Unauthorized",
        description: "You don't have admin access.",
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

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
