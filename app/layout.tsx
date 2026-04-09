import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";

import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Smart Attendance AI",
  description:
    "A student attendance system with roster management, facial recognition scanning, and exportable reports.",
};

import { getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let themeClass = "";
  let appLang = "en";
  try {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("app_language")?.value;
    const storedPreference = getSetting("theme_preference", "dark");
    themeClass = storedPreference === "dark" ? "dark" : "light";
    appLang =
      cookieLang === "ar" || cookieLang === "en"
        ? cookieLang
        : getSetting("app_language", "en");
  } catch {
    // Graceful fallback during critical build phases where DB might be inaccessible
    themeClass = "dark";
    appLang = "en";
  }

  return (
    <html
      lang={appLang}
      dir={appLang === "ar" ? "rtl" : "ltr"}
      className={`${bodyFont.variable} ${monoFont.variable} h-full ${themeClass}`}
    >
      <body className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
