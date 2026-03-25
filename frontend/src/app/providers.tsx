"use client";

import { useEffect } from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "@/context/AuthContext";
import theme from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isBrowserExtensionError = (value: unknown): boolean => {
      if (!value) return false;
      if (typeof value === "string") {
        return value.includes("chrome-extension://") || value.includes("MetaMask");
      }
      if (typeof value === "object") {
        const rec = value as Record<string, unknown>;
        const message = String(rec.message ?? "");
        const stack = String(rec.stack ?? "");
        const fileName = String(rec.fileName ?? rec.filename ?? "");
        return (
          message.includes("MetaMask") ||
          message.includes("chrome-extension://") ||
          stack.includes("chrome-extension://") ||
          fileName.includes("chrome-extension://")
        );
      }
      return false;
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isBrowserExtensionError(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (
        isBrowserExtensionError(event.error) ||
        isBrowserExtensionError(event.message) ||
        isBrowserExtensionError(event.filename)
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
