import { listAllSchedules, listAllClasses, listTeachers } from "@/lib/db";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { Calendar, Clock, Trash2, Plus, User, BookOpen } from "lucide-react";
import { WeeklyGridBuilder } from "@/components/admin/weekly-grid-builder";
import { deleteScheduleAction } from "@/app/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdminRole } from "@/lib/auth";

export default async function SchedulesPage() {
  const session = await requireAdminRole();
  const schedules = await listAllSchedules(session.buildingId);
  const classes = await listAllClasses(session.buildingId);
  const teachers = await listTeachers(session.buildingId);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            Master Schedule
          </h1>
          <p className="text-[var(--color-muted)]">
            Organize daily class slots and assign teachers to specific subjects and times.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Creation Form */}
        <div className="space-y-6">
          <WeeklyGridBuilder 
            classes={classes.map(c => ({ id: c.id, name: c.name }))} 
            teachers={teachers.map(t => ({ id: t.id, fullName: t.fullName }))} 
          />
        </div>

        {/* Schedule List */}
        <div className="space-y-6 border-t border-[var(--color-line)] pt-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold flex items-center gap-2 text-[var(--color-ink)] text-xl">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
              Active System Timetable
            </h3>
          </div>

          <div className="space-y-8">
            {days.map(day => {
              const daySchedules = schedules.filter(s => s.dayOfWeek === day);
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2 px-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                    {day}
                  </h4>
                  <div className="grid gap-3">
                    {daySchedules.map((item) => (
                      <div 
                        key={item.id} 
                        className="card group hover:border-[var(--color-accent)]/30 transition-all flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--color-accent)] border border-[var(--color-line)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--color-ink)]">{item.startTime} - {item.endTime}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--color-muted)] border border-[var(--color-line)]">
                                {item.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-muted)]">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {item.className}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.teacherName}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <DeleteButton 
                          id={item.id} 
                          onDelete={deleteScheduleAction}
                          className="p-2 text-[var(--color-muted)] hover:text-[color-mix(in_srgb,var(--color-red)_90%,white)] hover:bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] rounded-lg transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {schedules.length === 0 && (
              <div className="card text-center p-12 text-[var(--color-muted)] italic">
                No schedule slots defined yet. Use the Weekly Grid Builder above to generate a timetable.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
