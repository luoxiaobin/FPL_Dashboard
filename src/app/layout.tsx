import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BuildInfo from "@/components/BuildInfo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FPL Dashboard | Live Points & Roster",
  description: "High-performance, centralized interface for managing Fantasy Premier League data.",
  icons: {
    icon: "/branding/logos/logo-final-icon.svg",
    shortcut: "/branding/logos/logo-final-icon.svg",
    apple: "/branding/logos/logo-final-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <BuildInfo />
      </body>
    </html>
  );
}
