import { ReactNode } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { LogoutButton } from "@/components/logout-button";
import { DynamicPageTitle } from "@/components/dynamic-page-title";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopWeatherCard } from "@/components/top-weather-card";
import { requireSession } from "@/lib/auth";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage, getThemePreference } from "@/lib/i18n-server";
import { getUserByEmail, getStudentByUserId, getStudentClasses } from "@/lib/db";
import { Home, Calendar, ListTodo, ChevronDown, GraduationCap, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/nav-link";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const lang = await getAppLanguage();
  const initialTheme = await getThemePreference();
  const t = createTranslator(lang);

  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  const enrolledClasses = studentProfile ? await getStudentClasses(studentProfile.id) : [];

  return (
    <DashboardShell
      topbar={
        <div className="glass-card relative flex h-[74px] items-center gap-4 overflow-visible px-4 sm:px-6 border-b border-[var(--color-line)] bg-[var(--surface-1)]">
          <div className="flex flex-1 min-w-0 items-center gap-4">
            <DynamicPageTitle initialLang={lang} />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="hidden xl:block">
              <TopWeatherCard />
            </div>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_86%,transparent)] text-sm font-bold text-[var(--color-ink)]">
              {session.email.charAt(0).toUpperCase()}
            </div>

            <ThemeToggle initialTheme={initialTheme} className="shrink-0" />
            <LanguageToggle initialLanguage={lang} className="shrink-0" />
          </div>
        </div>
      }
      sidebar={
        <aside className="flex h-full flex-col overflow-hidden bg-[var(--surface-1)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-text)] pb-4">
          <Link href="/student" className="flex items-center gap-3 px-6 py-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--sidebar-border)]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              Classroom
            </span>
          </Link>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
            <NavLink href="/student" lang={lang} labelKey="nav.home" overrideLabel="Home" icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`} />
            <NavLink href="/student/attendance" lang={lang} labelKey="nav.attendanceLog" overrideLabel="Attendance Log" icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`} />
            <NavLink href="/student/calendar" lang={lang} labelKey="nav.calendar" overrideLabel="Calendar" icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`} />

            <div className="pt-4 border-t border-[var(--sidebar-border)] mt-4">
              <div className="px-3 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                <span>Enrolled</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <NavLink href="/student/todo" lang={lang} labelKey="nav.todo" overrideLabel="To-do" icon={`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>`} />
              
              <div className="space-y-0.5 mt-2">
                {enrolledClasses.map(c => (
                  <Link 
                    key={c.id} 
                    href={`/student/classes/${c.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--color-ink)] transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 uppercase font-black text-[10px]">
                      {c.name.charAt(0)}
                    </div>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--sidebar-border)] p-3 space-y-1">
             <Link href="/help" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--color-ink)] transition-colors">
                <HelpCircle className="w-4 h-4" />
                <span>Help Center</span>
             </Link>
             <LogoutButton lang={lang} />
          </div>
        </aside>
      }
    >
      <main className="h-full bg-[var(--color-canvas)]">
        {children}
      </main>
    </DashboardShell>
  );
}
