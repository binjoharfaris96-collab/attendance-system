import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses, getTeacherAssignments } from "@/lib/db";
import { AssignmentForm } from "@/components/teacher/assignment-form";
import { AlertCircle, CopyCheck } from "lucide-react";

export default async function TeacherAssignmentsPage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to manage assignments.</p>
      </div>
    );
  }

  const classes = await getTeacherClasses(teacherProfile.id);
  const assignments = await getTeacherAssignments(teacherProfile.id);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <CopyCheck className="w-8 h-8 text-[var(--color-accent)]" />
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Assignment Hub</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <AssignmentForm classes={classes} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-4">Dispatched Tasks</h2>
          
          <div className="space-y-4">
            {assignments.length === 0 ? (
               <div className="card p-12 flex flex-col items-center justify-center text-center border-dashed">
                  <CopyCheck className="w-12 h-12 text-[var(--color-muted)] opacity-50 mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">No assignments dispatched</h3>
                  <p className="text-[var(--color-muted)] max-w-sm">Use the form on the left to create your first class assignment.</p>
               </div>
            ) : (
               assignments.map(assignment => {
                  const dueDate = new Date(assignment.dueDate);
                  const isOverdue = dueDate < new Date();
                  const completePercentage = assignment.totalStudents 
                     ? Math.round((assignment.submittedCount / assignment.totalStudents) * 100) 
                     : 0;

                  return (
                     <div key={assignment.id} className="card p-6 group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                           <div className="px-3 py-1 rounded bg-[var(--surface-2)] text-xs font-semibold text-[var(--color-muted)] tracking-wider">
                              {assignment.className}
                           </div>
                           <div className={`text-xs font-bold px-2 py-1 rounded ${isOverdue ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              Due {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                           </div>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--color-ink)] pb-4">{assignment.title}</h3>
                        
                        <div className="pt-4 border-t border-[var(--color-line)]">
                           <div className="flex justify-between items-end mb-2">
                              <div className="text-sm">
                                 <span className="font-bold text-[var(--color-ink)]">{assignment.submittedCount}</span>
                                 <span className="text-[var(--color-muted)]"> / {assignment.totalStudents} Submitted</span>
                              </div>
                              <span className="text-sm font-bold text-[var(--color-accent)]">{completePercentage}%</span>
                           </div>
                           <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                              <div 
                                 className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-500" 
                                 style={{ width: `${completePercentage}%` }}
                              />
                           </div>
                        </div>
                     </div>
                  );
               })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
