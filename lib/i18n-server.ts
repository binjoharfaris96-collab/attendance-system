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
  } catch (e) {
    // cookies() might throw in some environments, fallback to DB
  }
  
  return (getSetting("app_language", "en") as AppLanguage) || "en";
}
