"use client";

import { useEffect, useState } from "react";
import { t, type AppLanguage } from "@/lib/i18n";

type ThemePreference = "light" | "dark";

function detectThemeFromHtml(): ThemePreference {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({ initialTheme }: { initialTheme: ThemePreference }) {
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [lang, setLang] = useState<AppLanguage>("en");

  useEffect(() => {
    const syncFromDom = () => {
      setTheme(detectThemeFromHtml());
      setLang(document.documentElement.lang === "ar" ? "ar" : "en");
    };

    syncFromDom();

    const observer = new MutationObserver(syncFromDom);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "lang"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = async () => {
    const nextTheme: ThemePreference = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(nextTheme);

    try {
      await fetch("/api/settings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ key: "theme_preference", value: nextTheme }],
        }),
      });
    } catch (error) {
      console.error("Failed to persist theme setting", error);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="floating-action inline-flex h-10 w-10 items-center justify-center"
      aria-label={t("settings.themeMode", lang)}
      title={theme === "dark" ? t("settings.themeDark", lang) : t("settings.themeLight", lang)}
    >
      {theme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[color-mix(in_srgb,var(--color-amber)_95%,white)]"
        >
          <path d="M12 3a6.75 6.75 0 1 0 9 9A9 9 0 1 1 12 3Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[color-mix(in_srgb,var(--color-accent)_92%,white)]"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
