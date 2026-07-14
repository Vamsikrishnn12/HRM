import type { Metadata } from "next";
import { Providers } from "./providers";
import logoImage from "@/assets/logobg.png";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Connect HR | Human Resource Management",
  description: "Connect people, simplify work, and empower your organization with Connect HR.",
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
