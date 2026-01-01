import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { SessionProvider } from "@/lib/auth/session-context";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Tweet Hub",
  description: "A calm space for fast thoughts and real conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
