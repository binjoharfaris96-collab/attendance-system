import { requireSession } from "@/lib/auth";
import { 
  getStudentByUserId, 
  getStudentAttendanceSummary, 
  getUserByEmail, 
  getStudentAssignments 
} from "@/lib/db";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AnnouncementFeed } from "@/components/announcement-feed";
import { listParentRequestsForStudent } from "@/lib/db";
import { updateParentRequestAction } from "@/app/actions/parent";

export default async function StudentPortalPage() {
  const session = await requireSession();
  
  // Find user and student profile logically linked to them
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  
  // If not linked yet, show the "Account Not Linked" UI
  if (!studentProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="p-8 rounded-2xl border-2 border-dashed border-[var(--color-line)] bg-[var(--surface-1)] text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[var(--color-danger)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto">
            You are logged in as <span className="font-medium text-[var(--color-ink)]">{session.email}</span>, but your account has not been bound to a physical attendance record yet. 
          </p>
          <div className="pt-4 text-sm text-[var(--color-muted)] bg-[var(--surface-2)] p-4 rounded-xl mt-4">
            <strong>Action Required:</strong> Please inform your homeroom teacher or system administrator so they can link your email to your student profile (Student Code).
          </div>
        </div>
      </div>
    );
  }

  // Real dashboard for linked students
  const summary = await getStudentAttendanceSummary(studentProfile.id);
  const assignments = await getStudentAssignments(studentProfile.id);
  const pendingAssignments = assignments.filter(a => a.status === "Not Submitted").length;

  // Incoming parent requests
  const parentRequests = await listParentRequestsForStudent(studentProfile.id);
  const pendingRequests = parentRequests.filter(req => req.status === "pending");

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center space-x-4">
        {studentProfile.photoUrl ? (
          <img src={studentProfile.photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-[var(--surface-1)]" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent)]/50 flex items-center justify-center text-white text-xl font-bold uppercase shadow-sm shadow-[var(--color-accent)]/20">
            {studentProfile.fullName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-ink)] flex items-center space-x-2">
            <span>Welcome, {studentProfile.fullName.split(' ')[0]}!</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-[var(--color-muted)]">
            Class: <span className="font-medium">{studentProfile.className || "Unassigned"}</span> &middot; ID: {studentProfile.studentCode}
          </p>
        </div>
      </div>

      <div className="pt-2">
         <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-3">Enrolled Subjects</h3>
         <div className="flex flex-wrap gap-2">
            {assignments.map(a => a.className).filter((v, i, a) => a.indexOf(v) === i).map(clsName => (
               <span key={clsName} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs border border-purple-500/20">
                  {clsName}
               </span>
            ))}
            {assignments.length === 0 && <span className="text-sm italic text-[var(--color-muted)]">No active classes found.</span>}
         </div>
      </div>

      {/* Pending Parent Requests */}
      {pendingRequests.length > 0 && (
        <section className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Connection Requests</span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--color-line)]">
                <div>
                  <p className="font-bold text-[var(--color-ink)]">{req.parentName}</p>
                  <p className="text-sm text-[var(--color-muted)]">{req.parentEmail} is requesting access to view your academic and attendance records.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <form action={updateParentRequestAction}>
                     <input type="hidden" name="requestId" value={req.id} />
                     <input type="hidden" name="status" value="rejected" />
                     <button type="submit" className="btn bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white border-none py-1.5 px-3 uppercase tracking-wider text-xs font-bold">Reject</button>
                  </form>
                  <form action={updateParentRequestAction}>
                     <input type="hidden" name="requestId" value={req.id} />
                     <input type="hidden" name="status" value="approved" />
                     <button type="submit" className="btn btn--primary py-1.5 px-3 uppercase tracking-wider text-xs font-bold shadow-none text-white bg-blue-600 hover:bg-blue-700">Approve</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div className="card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">On-Time Attendance</h2>
          <div className="text-5xl font-extrabold text-[var(--color-ink)] mb-4 tracking-tighter">
            {summary.percentage}%
          </div>
          <div className="text-sm text-[var(--color-muted)]">
            Present for {summary.presentDays} out of {summary.totalSchoolDays} term days.
          </div>
        </div>

        {/* Assignments Card */}
        <div className="card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-24 h-24" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">Pending Assignments</h2>
          <div className="text-5xl font-extrabold text-[var(--color-accent)] mb-4 tracking-tighter">
            {pendingAssignments}
          </div>
          <div className="text-sm text-[var(--color-muted)]">
            Tasks currently awaiting submission.
          </div>
        </div>

        {/* Behavior Card */}
        <div className="card p-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertCircle className="w-24 h-24 text-[var(--color-warning)]" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">Warnings / Lates</h2>
          <div className="text-5xl font-extrabold text-[var(--color-ink)] mb-4 tracking-tighter">
            {studentProfile.latesCount}
          </div>
          <div className="text-sm text-[var(--color-muted)]">
            Morning Lates recorded this term.
          </div>
        </div>
      </div>

      <div className="pt-4">
         <AnnouncementFeed role="student" />
      </div>
    </div>
  );
}
