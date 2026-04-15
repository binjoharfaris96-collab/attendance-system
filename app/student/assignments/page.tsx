import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAssignments } from "@/lib/db";
import { AlertCircle, BookOpen, Clock } from "lucide-react";

export default async function StudentAssignmentsPage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;

  if (!studentProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to view assignments.</p>
      </div>
    );
  }

  const assignments = await getStudentAssignments(studentProfile.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpen className="w-8 h-8 text-[var(--color-accent)]" />
        <h1 className="text-3xl font-bold text-[var(--color-ink)]">My Assignments</h1>
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        {assignments.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-[var(--color-muted)] flex flex-col items-center">
            <BookOpen className="w-12 h-12 mb-4 opacity-50" />
            <p>You have no upcoming assignments. Enjoy your free time!</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date() && assignment.status === "Not Submitted";
            
            return (
              <div key={assignment.id} className="card p-6 flex flex-col relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${assignment.status === 'Submitted' ? 'bg-emerald-500' : isOverdue ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]'}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    {assignment.className}
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${assignment.status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--surface-2)] text-[var(--color-ink)]'}`}>
                    {assignment.status}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--color-ink)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">{assignment.title}</h3>
                <p className="text-sm text-[var(--color-muted)] mb-6 flex-1 line-clamp-2">
                  {assignment.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-line)]">
                  <div className={`flex items-center space-x-2 text-sm ${isOverdue ? 'text-[var(--color-danger)] font-semibold' : 'text-[var(--color-muted)]'}`}>
                    <Clock className="w-4 h-4" />
                    <span>Due: {dueDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {assignment.score !== null && (
                    <div className="text-sm font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)] px-2 py-1 rounded">
                      Score: {assignment.score}/100
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
