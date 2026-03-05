"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthLoader from "@/components/ui/AuthLoader";

export default function Home() {
  const { user, isAuthenticated, isLoading, authStatus } = useAuth();
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

  return <AuthLoader status={authStatus} />;
}
