import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses, getTeacherAssignments } from "@/lib/db";
import { AlertCircle, CheckCircle2, GraduationCap, CopyCheck, Users } from "lucide-react";
import { AnnouncementFeed } from "@/components/announcement-feed";

export default async function TeacherPortalPage() {
  const session = await requireSession();
  
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="p-8 rounded-2xl border-2 border-dashed border-[var(--color-line)] bg-[var(--surface-1)] text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[var(--color-danger)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto">
            You are logged in as <span className="font-medium text-[var(--color-ink)]">{session.email}</span>, but your account has not been bound to an Instructor profile yet.
          </p>
          <div className="pt-4 text-sm text-[var(--color-muted)] bg-[var(--surface-2)] p-4 rounded-xl mt-4">
            <strong>Action Required:</strong> Please contact the system administrator to bind your email to your class rosters.
          </div>
        </div>
      </div>
    );
  }

  const classes = await getTeacherClasses(teacherProfile.id);
  const assignments = await getTeacherAssignments(teacherProfile.id);
  
  // Calculate raw number of submissions awaiting grading
  const totalSubmissions = assignments.reduce((acc, curr) => acc + curr.submittedCount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-purple-600 flex items-center justify-center text-white text-xl font-bold uppercase shadow-sm">
          {teacherProfile.fullName.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-ink)] flex items-center space-x-2">
            <span>Welcome, {teacherProfile.fullName.split(' ')[0]}</span>
            <CheckCircle2 className="w-6 h-6 text-[var(--color-accent)]" />
          </h1>
          <p className="text-[var(--color-muted)]">
            Department: <span className="font-medium">{teacherProfile.department || "General"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Classes Card */}
        <div className="card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <GraduationCap className="w-24 h-24" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">Active Classes</h2>
          <div className="text-5xl font-extrabold text-[var(--color-ink)] mb-4 tracking-tighter">
            {classes.length}
          </div>
          <div className="text-sm text-[var(--color-muted)]">
            Currently teaching {classes.reduce((sum, c) => sum + c.studentCount, 0)} enrolled students across all sections.
          </div>
        </div>

        {/* Assignments Card */}
        <div className="card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CopyCheck className="w-24 h-24 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">Submissions to Grade</h2>
          <div className="text-5xl font-extrabold text-[var(--color-accent)] mb-4 tracking-tighter">
            {totalSubmissions}
          </div>
          <div className="text-sm text-[var(--color-muted)]">
            Tasks currently awaiting your review.
          </div>
        </div>

        {/* Action Quick Link */}
        <div className="card p-6 border-transparent bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/teacher/assignments" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors border border-[var(--color-line)] bg-[var(--surface-1)]">
              <div className="bg-[var(--color-accent)]/10 p-2 rounded-lg text-[var(--color-accent)]">
                <CopyCheck className="w-5 h-5" />
              </div>
              <div className="font-medium">Create Assignment</div>
            </a>
            <a href="/teacher/classes" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors border border-[var(--color-line)] bg-[var(--surface-1)]">
              <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-medium">View Rosters</div>
            </a>
          </div>
        </div>
      </div>

      <div className="pt-4">
         <AnnouncementFeed role="teacher" />
      </div>
    </div>
  );
}
