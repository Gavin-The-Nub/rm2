import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RM Fitness - Gym Management",
  description: "Gym Membership & Check-In System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[var(--color-bg-base)] text-[var(--color-text-primary)]`}>
        {children}
      </body>
    </html>
  );
}
