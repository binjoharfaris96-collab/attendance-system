import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses } from "@/lib/db";
import { AlertCircle, Users, GraduationCap, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function TeacherClassesPage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to view class rosters.</p>
      </div>
    );
  }

  const classes = await getTeacherClasses(teacherProfile.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <GraduationCap className="w-8 h-8 text-[var(--color-accent)]" />
        <h1 className="text-3xl font-bold text-[var(--color-ink)]">My Classes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-[var(--color-muted)] flex flex-col items-center">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>You have no classes assigned to you.</p>
          </div>
        ) : (
          classes.map((cls) => (
              <Link 
                key={cls.id} 
                href={`/teacher/classes/${cls.id}`}
                className="card p-6 flex flex-col relative overflow-hidden group hover:border-[var(--color-accent)]/50 transition-all hover:translate-y-[-2px] cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">{cls.name}</h3>
                  <ChevronRight className="w-5 h-5 text-[var(--color-line)] group-hover:text-[var(--color-accent)] transition-colors" />
                </div>
                <div className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--color-muted)] tracking-wider w-fit mb-4">
                  {cls.subject || "General"}
                </div>
                <div className="flex items-center space-x-2 text-[var(--color-muted)] mt-auto pt-4 border-t border-[var(--color-line)]">
                   <Users className="w-4 h-4" />
                   <span className="font-medium text-[var(--color-ink)]">{cls.studentCount}</span>
                   <span>enrolled students</span>
                </div>
              </Link>
          ))
        )}
      </div>
    </div>
  );
}
