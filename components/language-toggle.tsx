"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type AppLanguage } from "@/lib/i18n";

function applyLanguage(nextLanguage: AppLanguage) {
  const html = document.documentElement;
  html.setAttribute("lang", nextLanguage);
  html.setAttribute("dir", nextLanguage === "ar" ? "rtl" : "ltr");
  document.cookie = `app_language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;

  try {
    window.localStorage.setItem("app_language", nextLanguage);
  } catch {
    // Ignore storage failures in constrained environments.
  }
}

export function LanguageToggle({
  initialLanguage,
  compact = false,
  className = "",
}: {
  initialLanguage: AppLanguage;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);
  const nextLanguageLabel =
    compact
      ? language === "en"
        ? "AR"
        : "EN"
      : language === "en"
        ? t("settings.languageArabic", "ar")
        : t("settings.languageEnglish", "en");

  useEffect(() => {
    // Sync with HTML lang attribute if changed elsewhere.
    const updateLang = () => {
      const htmlLang = document.documentElement.lang as AppLanguage;
      if (htmlLang && htmlLang !== language) {
        setLanguage(htmlLang);
      }
    };

    const observer = new MutationObserver(updateLang);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, [language]);

  const toggleLanguage = async () => {
    const nextLanguage = language === "en" ? "ar" : "en";
    setLanguage(nextLanguage);
    applyLanguage(nextLanguage);

    // Persist to DB.
    try {
      await fetch("/api/settings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [{ key: "app_language", value: nextLanguage }] }),
      });
    } catch (e) {
      console.error("Failed to persist language setting", e);
    }

    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--surface-1)] px-4 text-xs font-bold text-[var(--color-ink)] transition-all hover:bg-[var(--surface-2)] active:scale-95 ${className}`.trim()}
      aria-label={t("settings.language", language)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-accent)]"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span dir="ltr">{nextLanguageLabel}</span>
    </button>
  );
}
