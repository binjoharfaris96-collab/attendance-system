import { requireSession } from "@/lib/auth";
import { 
  getTeacherByUserId, 
  getUserByEmail, 
  getClassWithRoster 
} from "@/lib/db";
import { AlertCircle, Users, GraduationCap, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TeacherClassDetailPage({ params }: { params: { classId: string } }) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to view rosters.</p>
      </div>
    );
  }

  const classData = await getClassWithRoster(params.classId);
  if (!classData || classData.teacherId !== teacherProfile.id) {
    notFound();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/teacher/classes" 
          className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to My Classes
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-ink)] mb-2">
            {classData.name}
          </h1>
          <p className="text-lg text-[var(--color-muted)] font-medium">
            {classData.subject || "General Faculty Section"}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--color-accent)]/10 px-4 py-2 rounded-2xl border border-[var(--color-accent)]/20 shadow-sm">
           <Users className="w-5 h-5 text-[var(--color-accent)]" />
           <span className="text-xl font-black text-[var(--color-ink)]">{classData.students.length}</span>
           <span className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">Enrolled</span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden shadow-xl border-[var(--color-line)]">
         <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)]">
            <h3 className="font-bold flex items-center gap-2 text-[var(--color-ink)]">
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              Active Roster
            </h3>
         </div>
         
         <div className="divide-y divide-[var(--color-line)]">
            {classData.students.length === 0 ? (
              <div className="p-12 text-center text-[var(--color-muted)] italic">
                No students are currently enrolled in this class.
              </div>
            ) : (
              classData.students.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full ring-2 ring-transparent group-hover:ring-[var(--color-accent)]/20 transition-all overflow-hidden bg-[var(--surface-1)]">
                      {student.photoUrl ? (
                         <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-[var(--color-accent)]/5 text-[var(--color-accent)]">
                            <User className="w-6 h-6" />
                         </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">{student.fullName}</p>
                      <p className="text-xs text-[var(--color-muted)] font-mono">{student.studentCode}</p>
                    </div>
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">
                     Active
                  </div>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
}
