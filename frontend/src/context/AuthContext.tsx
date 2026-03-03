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

// ── Types ──
export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

// ── Dummy Credentials ──
interface Credential {
  email: string;
  password: string;
  user: User;
}

const CREDENTIALS: Credential[] = [
  {
    email: "admin@hrms.com",
    password: "Admin@123",
    user: { id: "1", name: "Admin User", email: "admin@hrms.com", role: "admin" },
  },
  {
    email: "user@hrms.com",
    password: "User@123",
    user: { id: "2", name: "John Employee", email: "user@hrms.com", role: "employee" },
  },
];

const STORAGE_KEY = "hrms_auth_user";

// ── Context ──
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  // Hydration guard — read localStorage only after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 800));

      const match = CREDENTIALS.find(
        (c) => c.email === email && c.password === password
      );

      if (match) {
        setUser(match.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user));
        const label = match.user.role === "admin" ? "Admin" : "Employee";
        toast({
          title: `Welcome, ${label}`,
          description: "You have logged in successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        return match.user;
      }

      toast({
        title: "Invalid credentials",
        description: "Please check your email and password.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
      return null;
    },
    [toast]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
