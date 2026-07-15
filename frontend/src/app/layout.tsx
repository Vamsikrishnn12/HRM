import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import logoImage from "@/assets/logobg.png";
import PWARegister from "@/components/pwa/PWARegister";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Connect HR | Human Resource Management",
  description: "Connect people, simplify work, and empower your organization with Connect HR.",
  applicationName: "Connect HR",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Connect HR",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: logoImage.src,
    shortcut: logoImage.src,
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0B72E7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
