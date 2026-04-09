import { cookies } from "next/headers";
import { getSetting } from "@/lib/db";
import type { AppLanguage } from "./i18n";

export async function getAppLanguage(): Promise<AppLanguage> {
  try {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("app_language")?.value;
    
    if (cookieLang === "ar" || cookieLang === "en") {
      return cookieLang as AppLanguage;
    }
  } catch {
    // cookies() might throw in some environments, fallback to DB
  }
  
  return (getSetting("app_language", "en") as AppLanguage) || "en";
}

export async function getThemePreference(): Promise<"light" | "dark"> {
  try {
    const cookieStore = await cookies();
    const cookieTheme = cookieStore.get("theme_preference")?.value;

    if (cookieTheme === "light" || cookieTheme === "dark") {
      return cookieTheme;
    }
  } catch {
    // Fallback to DB when cookies are unavailable.
  }

  return getSetting("theme_preference", "dark") === "light" ? "light" : "dark";
}
