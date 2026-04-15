import { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireSession();
  
  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <aside className="w-64 border-r border-[var(--color-line)] bg-[var(--surface-1)] flex flex-col">
        <div className="p-6 font-bold text-lg border-b border-[var(--color-line)]">
          ManageBac Student
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/student" className="block px-4 py-2 rounded-lg hover:bg-[var(--color-accent)] hover:text-white transition-colors group focus-visible:outline-none">
            <span className="font-medium group-hover:text-white">Dashboard</span>
          </Link>
          <Link href="/student/attendance" className="block px-4 py-2 rounded-lg hover:bg-[var(--color-accent)] hover:text-white transition-colors group focus-visible:outline-none">
            <span className="font-medium group-hover:text-white">Attendance Log</span>
          </Link>
          <Link href="/student/assignments" className="block px-4 py-2 rounded-lg hover:bg-[var(--color-accent)] hover:text-white transition-colors group focus-visible:outline-none">
            <span className="font-medium group-hover:text-white">Assignments</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-[var(--color-line)]">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[var(--color-canvas)]">
        {children}
      </main>
    </div>
  );
}
