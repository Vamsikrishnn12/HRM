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
  API_BASE,
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
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const router = useRouter();
  const toast = useToast();

  /**
   * On mount: trust localStorage immediately so the UI never blocks.
   * Validate the session with /auth/me in the background; if it fails
   * the interceptor / refresh logic will handle it on the next API call.
   */
  useEffect(() => {
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

    // Trust the stored user right away so routing can proceed instantly
    try {
      const parsed: User = JSON.parse(stored);
      setUser(parsed);
      setAuthStatus("authenticated");
    } catch {
      clearAccessToken();
      localStorage.removeItem(USER_STORAGE_KEY);
      setAuthStatus("unauthenticated");
    }
    setIsLoading(false);

    // Background validation — if it fails, the next API call will
    // trigger the refresh flow or dispatch auth:expired.
    const controller = new AbortController();
    fetch(
      `${API_BASE}/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        signal: controller.signal,
      },
    ).catch(() => {
      // Silently ignore — the interceptor handles 401s
    });

    return () => controller.abort();
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
