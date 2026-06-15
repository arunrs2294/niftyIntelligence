import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nifty Intelligence",
  description: "Daily pre-market analysis for Nifty/Sensex intraday trading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <nav className="border-b bg-background px-6 py-3.5 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-base tracking-tight">
            📊 Nifty Intelligence
          </Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/must-read" className="text-muted-foreground hover:text-foreground transition-colors">
              Must Read
            </Link>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
