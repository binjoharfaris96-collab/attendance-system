import { ReactNode } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { LogoutButton } from "@/components/logout-button";
import { NavLink } from "@/components/nav-link";
import { DynamicPageTitle } from "@/components/dynamic-page-title";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireSession } from "@/lib/auth";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage, getThemePreference } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const lang = await getAppLanguage();
  const initialTheme = await getThemePreference();
  const t = createTranslator(lang);

  const navigationItems = [
    { href: "/student", labelKey: "nav.studentDashboard", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>` },
    { href: "/student/attendance", labelKey: "nav.attendanceLog", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { href: "/student/assignments", labelKey: "nav.assignments", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
  ] as const;

  return (
    <DashboardShell
      topbar={
        <div className="glass-card relative flex h-[74px] items-center gap-4 overflow-visible px-4 sm:px-6">
          <div className="flex flex-1 min-w-0 items-center gap-4">
            <DynamicPageTitle initialLang={lang} />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_86%,transparent)] text-sm font-bold text-[var(--color-ink)]">
              {session.email.charAt(0).toUpperCase()}
            </div>

            <ThemeToggle initialTheme={initialTheme} className="shrink-0" />
            <LanguageToggle initialLanguage={lang} className="shrink-0" />
          </div>
        </div>
      }
      sidebar={
        <aside className="depth-panel flex h-full flex-col overflow-hidden p-3 text-[var(--sidebar-text)]">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--sidebar-border)] bg-[color-mix(in_srgb,var(--surface-1)_82%,transparent)] px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--sidebar-text)]">
              {t("shell.brandName")}
            </span>
          </Link>

          <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pe-1">
            {navigationItems.map((item) => (
              <NavLink key={item.href} href={item.href} labelKey={item.labelKey} lang={lang} icon={item.icon} />
            ))}
          </nav>

          <div className="mt-4 border-t border-[var(--sidebar-border)] pt-4">
            <div className="space-y-1.5">
              <NavLink 
                href="/settings" 
                labelKey="nav.settings" 
                lang={lang} 
                icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0"/><circle cx="12" cy="12" r="3"/></svg>`}
              />
              <NavLink
                href="/help"
                labelKey="nav.helpCenter"
                lang={lang}
                icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`}
              />
              <LogoutButton lang={lang} />
            </div>
          </div>
        </aside>
      }
    >
      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>
    </DashboardShell>
  );
}
