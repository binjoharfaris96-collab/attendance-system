"use client";

import { usePathname } from "next/navigation";
import { t, type AppLanguage } from "@/lib/i18n";
import { useEffect, useState } from "react";

const routeTitleMap: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/apps": "nav.apps",
  "/students": "nav.students",
  "/attendance": "nav.attendanceLog",
  "/statistics": "nav.statistics",
  "/warnings": "nav.warnings",
  "/device-logs": "nav.deviceLogs",
  "/settings": "nav.settings",
  "/help": "nav.helpCenter",
  "/exam-monitor": "nav.examMonitor",
  "/behavior": "nav.behavior",
  "/excuses": "nav.absences",
  "/export": "nav.dataExport",
  "/recognition": "nav.scanFace",
};

export function DynamicPageTitle({ initialLang }: { initialLang: AppLanguage }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<AppLanguage>(initialLang);

  useEffect(() => {
    const updateLang = () => {
      const htmlLang = document.documentElement.lang as AppLanguage;
      if (htmlLang && htmlLang !== lang) {
        setLang(htmlLang);
      }
    };
    const observer = new MutationObserver(updateLang);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, [lang, initialLang]);

  // Find the closest match in the map
  const activeRoute = Object.keys(routeTitleMap).find(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const titleKey = activeRoute ? routeTitleMap[activeRoute] : "dashboard.title";

  return (
    <h1 className="text-sm font-bold tracking-tight text-[var(--color-ink)] sm:text-base">
      {t(titleKey, lang)}
    </h1>
  );
}
