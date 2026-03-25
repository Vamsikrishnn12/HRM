import type { Metadata } from "next";
import { Providers } from "./providers";
import logoImage from "@/assets/logo.png";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Zora HR - Human Resource Management System",
  description: "Streamline your workforce management with Zora HR",
  icons: {
    icon: logoImage.src,
    shortcut: logoImage.src,
    apple: logoImage.src,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}