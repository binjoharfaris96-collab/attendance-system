import { Megaphone } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { getLatestAnnouncementsForRole, getUserByEmail } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function ParentAnnouncementsPage() {
  const session = await requireSession();

  const parent = await getUserByEmail(session.email);
  const announcements = await getLatestAnnouncementsForRole("parent", parent?.buildingId ?? null, 50);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-8 text-white shadow-2xl shadow-amber-500/20 md:p-10">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Megaphone className="h-3.5 w-3.5" />
            School Communications
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Announcements</h1>
          <p className="max-w-2xl text-sm font-medium text-white/80 md:text-base">
            Stay informed about school events, policy updates, and important notices for families.
          </p>
        </div>
      </section>

      {announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm italic text-[var(--color-muted)]">
            No announcements for parents at this time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((ann) => (
            <article key={ann.id} className="card border-l-4 border-l-amber-500/40 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                {formatDateTime(ann.createdAt)}
              </p>
              <h2 className="mt-2 text-xl font-black text-[var(--color-ink)]">{ann.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{ann.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
