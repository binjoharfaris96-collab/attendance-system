import { getLatestAnnouncements } from "@/lib/db";
import { Megaphone, Calendar, School, Users, GraduationCap, Paperclip } from "lucide-react";
import { formatDateTime } from "@/lib/time";
import type { Announcement } from "@/lib/types";

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    {ann.authorPhoto ? (
                      <img src={ann.authorPhoto} alt={ann.authorName || "Author"} className="w-6 h-6 rounded-full object-cover border border-[var(--color-line)]" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] text-[10px] font-bold uppercase">
                        {ann.authorName?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex flex-col -space-y-0.5">
                       <span className="text-[10px] font-bold text-[var(--color-ink)] leading-tight">{ann.authorName || "Staff"}</span>
                       <div className="flex items-center gap-1 opacity-60">
                          {ann.targetRole === "all" ? (
                            <School className="w-2 h-2 text-blue-500" />
                          ) : ann.targetRole === "student" ? (
                            <Users className="w-2 h-2 text-emerald-500" />
                          ) : (
                            <GraduationCap className="w-2 h-2 text-purple-500" />
                          )}
                          <span className="text-[8px] font-bold uppercase tracking-tight">
                            To {ann.targetRole === "all" ? "Whole School" : ann.targetRole}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-1 text-[var(--color-muted)]">
                   <Calendar className="w-3 h-3" />
                   <span className="text-[10px]">{formatDateTime(ann.createdAt)}</span>
                 </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--color-ink)] leading-tight">{ann.title}</h4>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
                  {ann.content}
                </p>
              </div>
              {ann.attachmentUrl && (
                <div className="pt-1 flex items-center gap-2">
                  <a 
                    href={ann.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--color-line)] text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] transition-all group/link"
                  >
                    <Paperclip className="w-3 h-3 text-[var(--color-accent)] group-hover/link:text-white" />
                    <span>{ann.attachmentName || "View Attachment"}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
