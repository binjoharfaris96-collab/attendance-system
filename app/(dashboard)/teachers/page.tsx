import Link from "next/link";
import { TeacherForm } from "@/components/admin/teacher-form";
import { requireSession } from "@/lib/auth";
import { listTeachers } from "@/lib/db";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { Users, GraduationCap } from "lucide-react";

export default async function TeachersPage() {
  const session = await requireSession();
  const teachers = await listTeachers(session.buildingId);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            {t("nav.teachers")}
          </h1>
          <p className="text-[var(--color-muted)]">
            Manage faculty records and digital account linking.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Add Form */}
        <TeacherForm />

        {/* Teachers List */}
        <div className="card md:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)]">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Faculty Members ({teachers.length})
            </h3>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {teachers.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted)] italic">
                No teacher records found.
              </div>
            ) : (
              teachers.map((teacher) => (
                <Link 
                  key={teacher.id} 
                  href={`/teachers/${teacher.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[color-mix(in_srgb,var(--color-accent)_5%,transparent)] transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{teacher.fullName}</p>
                      <p className="text-sm text-[var(--color-muted)]">{teacher.department || "General Faculty"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold uppercase text-[var(--color-muted)]">Classes</p>
                      <p className="text-sm font-bold text-[var(--color-ink)]">{teacher.classesCount}</p>
                    </div>
                    {teacher.userId ? (
                       <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">Linked</span>
                    ) : (
                       <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase">Unlinked</span>
                    )}
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
