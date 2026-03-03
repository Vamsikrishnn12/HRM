"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (user?.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/employee/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="surface.bg">
      <Spinner size="lg" color="brand.400" thickness="3px" />
    </Flex>
  );
}
