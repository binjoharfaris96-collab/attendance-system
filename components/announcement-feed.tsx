import { getLatestAnnouncements } from "@/lib/db";
import { Megaphone, Calendar, School, Users, GraduationCap } from "lucide-react";
import { formatDateTime } from "@/lib/time";

export async function AnnouncementFeed({ role, limit = 3 }: { role: string; limit?: number }) {
  const announcements = await getLatestAnnouncements(role, limit);

  if (announcements.length === 0) {
    return (
      <div className="card text-center py-10 border-dashed border-2 border-[var(--color-line)] bg-transparent">
        <Megaphone className="w-8 h-8 text-[var(--color-muted)] mx-auto mb-2 opacity-20" />
        <p className="text-sm text-[var(--color-muted)] italic">No recent school announcements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold flex items-center gap-2 text-[var(--color-ink)] uppercase tracking-wider text-xs">
          <Megaphone className="w-4 h-4 text-amber-500" />
          School News
        </h3>
      </div>
      
      <div className="grid gap-3">
        {announcements.map((ann) => (
          <div key={ann.id} className="card p-4 transition-all hover:translate-x-1 border-s-4 border-s-amber-500/40">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    {ann.targetRole === "all" ? (
                      <School className="w-3 h-3 text-blue-500" />
                    ) : ann.targetRole === "student" ? (
                      <Users className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <GraduationCap className="w-3 h-3 text-purple-500" />
                    )}
                    <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase">
                      {ann.targetRole === "all" ? "Whole School" : ann.targetRole}
                    </span>
                 </div>
                 <div className="flex items-center gap-1 text-[var(--color-muted)]">
                   <Calendar className="w-3 h-3" />
                   <span className="text-[10px]">{formatDateTime(ann.createdAt)}</span>
                 </div>
              </div>
              <h4 className="font-bold text-[var(--color-ink)] leading-tight">{ann.title}</h4>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
                {ann.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
