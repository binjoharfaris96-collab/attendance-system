"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/parent", label: "Dashboard", exact: true },
  { href: "/parent/announcements", label: "Announcements", exact: false },
  { href: "/parent/help", label: "Help Center", exact: false },
] as const;

export function ParentTopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--color-ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
