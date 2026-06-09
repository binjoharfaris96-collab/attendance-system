"use client";

import { useEffect, useRef, useState } from "react";
import { loginAsDemoRole } from "@/app/actions/demo";

const ROLE_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  owner: {
    label: "Owner",
    color: "#fb7185",
    bg: "rgba(251,113,133,0.15)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
      </svg>
    ),
  },
  admin: {
    label: "Admin",
    color: "#8ea4ff",
    bg: "rgba(142,164,255,0.15)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  teacher: {
    label: "Teacher",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.15)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M19 10.5h2"/><path d="M19 8.5h2"/><path d="M19 12.5h2"/>
      </svg>
    ),
  },
  student: {
    label: "Student",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.15)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  parent: {
    label: "Parent",
    color: "#50d8ca",
    bg: "rgba(80,216,202,0.15)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
};

const ALL_ROLES = ["owner", "admin", "teacher", "student", "parent"] as const;

export function SwitchRoleButton({ currentRole }: { currentRole: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = ROLE_META[currentRole] ?? ROLE_META.admin;

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:scale-[1.03] active:scale-95"
        style={{
          borderColor: `color-mix(in srgb, ${meta.color} 45%, var(--color-line))`,
          background: meta.bg,
          color: meta.color,
        }}
        aria-label="Switch role"
        aria-expanded={open}
      >
        {meta.icon}
        {meta.label}
        {/* chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[999] w-52 rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-1.5 shadow-2xl"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Switch Role
          </p>
          {ALL_ROLES.map((role) => {
            const m = ROLE_META[role];
            const isCurrent = role === currentRole;
            return (
              <form key={role} action={loginAsDemoRole}>
                <input type="hidden" name="role" value={role} />
                <button
                  type="submit"
                  disabled={isCurrent}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors disabled:cursor-default"
                  style={{
                    color: isCurrent ? m.color : "var(--color-ink)",
                    background: isCurrent ? m.bg : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = m.bg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: m.bg, color: m.color }}
                  >
                    {m.icon}
                  </span>
                  <span className="flex-1">{m.label}</span>
                  {isCurrent && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: m.bg, color: m.color }}
                    >
                      You
                    </span>
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
