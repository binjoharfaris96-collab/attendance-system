import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses, getTeacherAssignments, getTeacherSchedules } from "@/lib/db";
import { AlertCircle, GraduationCap, CopyCheck, Calendar } from "lucide-react";
import { ProfileCard } from "@/components/profile-card";
import Link from "next/link";

export default async function TeacherPortalPage() {
  const session = await requireSession();
  
  const user = await getUserByEmail(session.email);
  if (!user) return null; // Should not happen with session

  const teacherProfile = await getTeacherByUserId(user.id);

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
  const allSchedules = await getTeacherSchedules(teacherProfile.id);
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];
  const todaySchedules = allSchedules.filter(s => s.dayOfWeek === todayName);
  
  const totalSubmissions = assignments.reduce((acc, curr) => acc + curr.submittedCount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <ProfileCard user={{ 
        fullName: user.fullName, 
        email: user.email, 
        photoUrl: user.photo_url, 
        role: "Instructor" 
      }} />

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="card p-0 overflow-hidden border-t-4 border-t-[var(--color-accent)]">
          <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)] flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
              Today's Schedule ({todayName})
            </h3>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {todaySchedules.length === 0 ? (
              <div className="p-12 text-center text-[var(--color-muted)] italic">
                No classes scheduled for today.
              </div>
            ) : (
              todaySchedules.map(slot => (
                <div key={slot.id} className="p-4 hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--color-line)] flex flex-col items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold mt-1 leading-none">{slot.startTime.split(':')[0]}:{slot.startTime.split(':')[1]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">{slot.subject}</p>
                      <p className="text-xs text-[var(--color-muted)]">{slot.className}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/teacher/attendance/${slot.id}`}
                    className="btn btn-primary h-9 px-4 rounded-lg text-xs font-bold shadow-sm"
                  >
                    Mark Attendance
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assignments Feed or Announcements */}
        <div>
           <AnnouncementFeed role="teacher" />
        </div>
      </div>
    </div>
  );
}

