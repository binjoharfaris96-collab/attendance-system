"use client";

import { loginAsDemoRole } from "@/app/actions/demo";

const ROLES = [
  {
    id: "student",
    label: "Student",
    description: "View classes, assignments, grades, and attendance",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Manage classes, assignments, and attendance reports",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2" />
        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M19 10.5h2" /><path d="M19 8.5h2" /><path d="M19 12.5h2" />
      </svg>
    ),
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "parent",
    label: "Parent",
    description: "Monitor children's attendance, grades, and school updates",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "from-violet-500 to-violet-600",
  },
  {
    id: "admin",
    label: "Admin",
    description: "School statistics, attendance analytics, and management",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "owner",
    label: "Owner",
    description: "Multi-building overview and school-wide analytics",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
      </svg>
    ),
    color: "from-rose-500 to-rose-600",
  },
] as const;

export function DemoRolePicker() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ROLES.map((role) => (
        <form key={role.id} action={loginAsDemoRole}>
          <input type="hidden" name="role" value={role.id} />
          <button
            type="submit"
            className="group flex w-full flex-col items-start gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--surface-1)] p-6 text-left transition-all hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/10 active:scale-[0.98]"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} text-white shadow-md transition-transform group-hover:scale-110`}>
              {role.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink)]">{role.label}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{role.description}</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
              Enter as {role.label} →
            </span>
          </button>
        </form>
      ))}
    </div>
  );
}
