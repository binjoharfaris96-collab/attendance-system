import type { Metadata } from "next";

import "./globals.css";
import { getAppLanguage, getThemePreference } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Smart Attendance AI",
  description:
    "A student attendance system with roster management, facial recognition scanning, and exportable reports.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let themeClass = "";
  let appLang = "en";
  try {
    themeClass = await getThemePreference();
    appLang = await getAppLanguage();
  } catch {
    // Graceful fallback during critical build phases where DB might be inaccessible
    themeClass = "dark";
    appLang = "en";
  }

  return (
    <html
      lang={appLang}
      dir={appLang === "ar" ? "rtl" : "ltr"}
      className={`h-full ${themeClass}`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
