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
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const lang = await getAppLanguage();
  const initialTheme = await getThemePreference();
  const t = createTranslator(lang);

  if (session.role !== "parent") {
    redirect("/dashboard");
  }

  const navigationItems = [
    { href: "/parent", labelKey: "nav.parentDashboard", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
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
          <Link href="/parent" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--sidebar-border)] bg-[color-mix(in_srgb,var(--surface-1)_82%,transparent)] px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--sidebar-text)]">
              Parent Portal
            </span>
          </Link>

          <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pe-1">
            {navigationItems.map((item) => (
              <NavLink key={item.href} href={item.href} labelKey={item.labelKey} lang={lang} icon={item.icon} />
            ))}
          </nav>

          <div className="mt-4 border-t border-[var(--sidebar-border)] pt-4">
            <div className="space-y-1.5">
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
