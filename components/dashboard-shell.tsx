"use client";

import { useEffect, useState } from "react";
import { t, type AppLanguage } from "@/lib/i18n";

export function DashboardShell({
  topbar,
  sidebar,
  children,
}: {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");

  useEffect(() => {
    const updateLangFromHtml = () => {
      const htmlLang = document.documentElement.lang === "ar" ? "ar" : "en";
      setActiveLang(htmlLang);
    };

    updateLangFromHtml();

    const observer = new MutationObserver(updateLangFromHtml);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--color-canvas)]">
      <div className="shell-glow-layer opacity-85" />
      <div className="shell-dot-layer" />

      <header className="pointer-events-none fixed left-4 right-4 top-4 z-40 flex items-center gap-3 rtl:left-4 rtl:right-4 lg:left-6 lg:right-6">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="floating-action pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center lg:hidden"
          aria-label={
            isSidebarOpen
              ? t("shell.closeNavigation", activeLang)
              : t("shell.openNavigation", activeLang)
          }
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-sidebar"
        >
          {isSidebarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        <div className="pointer-events-auto min-w-0 flex-1">
          {topbar}
        </div>
      </header>

      <aside
        id="dashboard-sidebar"
        className={`fixed bottom-4 left-4 rtl:left-auto rtl:right-4 top-[92px] z-50 w-[248px] transition-transform duration-300 ease-out lg:left-6 lg:rtl:left-auto lg:rtl:right-6 lg:top-[98px] lg:!translate-x-0 ${
          isSidebarOpen ? "!translate-x-0" : "-translate-x-[calc(100%+1.25rem)] rtl:translate-x-[calc(100%+1.25rem)]"
        }`}
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            setIsSidebarOpen(false);
          }
        }}
      >
        {sidebar}
      </aside>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          aria-label={t("shell.closeNavigation", activeLang)}
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <main className="relative z-10 px-4 pb-10 pt-[112px] sm:px-6 lg:pl-[286px] lg:rtl:pl-6 lg:rtl:pr-[286px] lg:pr-6 lg:pt-[110px]">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
