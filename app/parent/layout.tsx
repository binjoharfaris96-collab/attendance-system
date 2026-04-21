import { ReactNode } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
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

  return (
    <div className="min-h-screen bg-[var(--surface-1)] text-[var(--color-ink)] transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--color-line)] bg-[var(--surface-1)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/parent" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent)]/60 text-white shadow-lg shadow-[var(--color-accent)]/20 transition-all group-hover:shadow-[var(--color-accent)]/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-[var(--color-ink)] uppercase leading-none">
                  {t("shell.brandName")}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-tighter mt-0.5">
                  Parent Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 pe-4 border-r border-[var(--color-line)]">
               <div className="text-right">
                  <p className="text-xs font-bold text-[var(--color-ink)] leading-none line-clamp-1">{session.email}</p>
                  <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase mt-0.5">Verified Parent</p>
               </div>
               <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[var(--surface-2)] border border-[var(--color-line)] text-xs font-black text-[var(--color-accent)]">
                  {session.email.charAt(0).toUpperCase()}
               </div>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
               <ThemeToggle initialTheme={initialTheme} className="shrink-0" />
               <LanguageToggle initialLanguage={lang} className="shrink-0" />
               <div className="ms-2">
                  <LogoutButton lang={lang} />
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="mt-20 border-t border-[var(--color-line)] bg-[var(--surface-2)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <span className="text-sm font-bold text-[var(--color-ink)]">© {new Date().getFullYear()} Attendance System</span>
              <span className="text-xs opacity-50">•</span>
              <span className="text-xs">Propelling Academic Excellence</span>
            </div>
            <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
              <Link href="/help" className="hover:text-[var(--color-accent)] transition-colors">Help Center</Link>
              <Link href="/announcements" className="hover:text-[var(--color-accent)] transition-colors">Announcements</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
