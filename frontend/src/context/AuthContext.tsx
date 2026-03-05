"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@chakra-ui/react";
import {
  api,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  ApiError,
} from "@/lib/api";
import { authApi } from "@/api";
import type {
  User,
  UserRole,
  LoginPayload,
  AuthStatus,
  AuthContextType,
} from "@/types";

const USER_STORAGE_KEY = "hrms_user";

// ── Context ──
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const router = useRouter();
  const toast = useToast();

  /**
   * On mount: quickly check localStorage. Only call /auth/me if we have
   * both a token AND stored user (i.e. returning session).
   * Use AbortController with a 4s timeout so the app never hangs.
   */
  useEffect(() => {
    const rehydrate = async () => {
      const token = getAccessToken();
      const stored = localStorage.getItem(USER_STORAGE_KEY);

      // No stored session → immediately mark unauthenticated, no API call
      if (!token || !stored) {
        clearAccessToken();
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuthStatus("unauthenticated");
        setIsLoading(false);
        return;
      }

      // We have a stored session — validate it
      setAuthStatus("checking");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
            signal: controller.signal,
          },
        );
        clearTimeout(timeout);

        const parsed: User = JSON.parse(stored);
        setUser(parsed);
        setAuthStatus("authenticated");
      } catch {
        clearTimeout(timeout);
        // Session invalid or backend unreachable — still try to use stored user
        // if token exists (will refresh on next API call)
        try {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
          setAuthStatus("authenticated");
        } catch {
          clearAccessToken();
          localStorage.removeItem(USER_STORAGE_KEY);
          setAuthStatus("unauthenticated");
        }
      } finally {
        setIsLoading(false);
      }
    };

    rehydrate();
  }, []);

  // Listen for auth:expired events from the API layer (401 + refresh failed)
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      clearAccessToken();
      localStorage.removeItem(USER_STORAGE_KEY);
      setAuthStatus("unauthenticated");
      router.push("/login");
      toast({
        title: "Session expired",
        description: "Please log in again.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [router, toast]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<User | null> => {
      try {
        setAuthStatus("checking");

        const data = await authApi.login(payload);

        // Store access token
        setAccessToken(data.accessToken);

        const role = data.user.role.toLowerCase() as UserRole;
        const loggedInUser: User = {
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          role,
          empId: data.user.empId,
          officeLocationRequired: data.user.officeLocationRequired,
        };

        setUser(loggedInUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
        setAuthStatus("redirecting");

        const label = role === "admin" ? "Admin" : "Employee";
        toast({
          title: `Welcome, ${label}`,
          description: "You have logged in successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });

        return loggedInUser;
      } catch (err) {
        setAuthStatus("unauthenticated");

        const message =
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.";

        toast({
          title: "Login failed",
          description: message,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top-right",
        });

        return null;
      }
    },
    [toast],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — still clear local state
    }

    setUser(null);
    clearAccessToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthStatus("unauthenticated");
    router.push("/login");

    toast({
      title: "Logged out",
      description: "You have been signed out.",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top-right",
    });
  }, [router, toast]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      authStatus,
      login,
      logout,
    }),
    [user, isLoading, authStatus, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Re-export types so existing consumers don't break
export type { User, UserRole, AuthStatus } from "@/types";
