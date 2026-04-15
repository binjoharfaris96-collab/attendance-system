import { listAllAnnouncements } from "@/lib/db";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { Megaphone, Users, GraduationCap, School } from "lucide-react";
import { deleteAnnouncementAction } from "@/app/actions/admin";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDateTime } from "@/lib/time";

export default async function AnnouncementsPage() {
  const announcements = await listAllAnnouncements();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            School Announcements
          </h1>
          <p className="text-[var(--color-muted)]">
            Post news and updates across Student and Teacher portals.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Form */}
        <AnnouncementForm />

        {/* List of Announcements */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-[var(--color-muted)] px-1">
            <Megaphone className="w-4 h-4" />
            Previous Posts
          </h3>
          
          {announcements.length === 0 ? (
            <div className="card text-center p-12 text-[var(--color-muted)] italic">
              No announcements yet. Be the first to post!
            </div>
          ) : (
            <div className="grid gap-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="card group relative border-l-4 border-l-amber-500/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {ann.targetRole === "all" && <School className="w-3 h-3 text-blue-500" />}
                        {ann.targetRole === "student" && <Users className="w-3 h-3 text-emerald-500" />}
                        {ann.targetRole === "teacher" && <GraduationCap className="w-3 h-3 text-purple-500" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                          To: {ann.targetRole} • {formatDateTime(ann.createdAt)}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-[var(--color-ink)]">{ann.title}</h4>
                      <p className="text-sm text-[var(--color-muted)] leading-relaxed">{ann.content}</p>
                    </div>
                    
                    <DeleteButton 
                      id={ann.id} 
                      onDelete={deleteAnnouncementAction} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
