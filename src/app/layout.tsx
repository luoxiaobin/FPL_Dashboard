import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import pkg from "../../package.json";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FPL Dashboard | Live Points & Roster",
  description: "High-performance, centralized interface for managing Fantasy Premier League data.",
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
        <div className="fixed bottom-2 right-3 text-xs text-slate-500/50 z-50 pointer-events-none font-mono tracking-widest">
          v{pkg.version}
        </div>
      </body>
    </html>
  );
}
