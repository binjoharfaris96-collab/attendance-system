import Link from "next/link";
import { ClassForm } from "@/components/admin/class-form";
import { requireSession } from "@/lib/auth";
import { listAllClasses, listTeachers } from "@/lib/db";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { School, Users, BookOpen, GraduationCap, ChevronRight } from "lucide-react";

export default async function ClassesPage() {
  const session = await requireSession();
  const classes = await listAllClasses(session.buildingId);
  const teachers = await listTeachers(session.buildingId);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            Class Management
          </h1>
          <p className="text-[var(--color-muted)]">
            Define subjects, assign teachers, and manage student rosters.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Statistics & Creation */}
        <div className="space-y-6">
          <div className="card bg-purple-600 text-white p-6 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <School className="w-32 h-32" />
             </div>
             <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-purple-200 mb-1">Total Sections</p>
                <p className="text-5xl font-black mb-4">{classes.length}</p>
                <div className="flex items-center gap-2 text-xs text-purple-100 bg-purple-700/30 p-2 rounded-lg backdrop-blur-sm">
                   <Users className="w-3 h-3" />
                   <span>{classes.reduce((acc, c) => acc + c.studentCount, 0)} Combined Students</span>
                </div>
             </div>
          </div>

          <ClassForm teachers={teachers} />
        </div>

        {/* Classes List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold flex items-center gap-2 text-[var(--color-ink)]">
              <BookOpen className="w-4 h-4 text-purple-500" />
              Active Roster Lists
            </h3>
          </div>
          
          <div className="grid gap-3">
            {classes.length === 0 ? (
              <div className="card text-center p-12 text-[var(--color-muted)] italic">
                No classes defined yet. Use the form to create your first class.
              </div>
            ) : (
              classes.map((cls) => (
                <Link 
                  key={cls.id} 
                  href={`/classes/${cls.id}`}
                  className="card group hover:border-purple-500/30 transition-all hover:translate-x-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-ink)]">{cls.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mt-0.5">
                           <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3 h-3" />
                              {cls.studentCount} Students
                           </span>
                           <span className="w-1 h-1 rounded-full bg-[var(--color-line)]"></span>
                           <span className="text-purple-600 font-bold">{cls.teacherName}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-line)] group-hover:text-purple-500 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
