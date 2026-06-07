import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getAssignmentById, getAssignmentSubmissions } from "@/lib/db";
import { notFound } from "next/navigation";
import { FileText, Calendar, Users, AlertCircle, FileCheck2 } from "lucide-react";
import { GradeForm } from "@/components/teacher/grade-form";

export default async function TeacherAssignmentDetail({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return notFound();

  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return notFound();

  const assignment = await getAssignmentById(params.id);
  if (!assignment) return notFound();

  const submissions = await getAssignmentSubmissions(params.id);

  const dueDate = new Date(assignment.dueDate);
  const isPastDue = dueDate < new Date();

  const submittedCount = submissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length;
  const gradedCount = submissions.filter(s => s.status === 'Graded').length;
  const totalCount = submissions.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Assignment Header */}
      <div className="card p-6 shadow-xl border-t-4 border-t-purple-500 bg-[var(--surface-1)]">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase rounded-md">
                {assignment.type || "Assignment"}
              </span>
              <span className="px-2 py-1 bg-[var(--surface-2)] text-[var(--color-muted)] text-[10px] font-bold uppercase rounded-md">
                {assignment.className}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-ink)]">{assignment.title}</h1>
            {assignment.topic && (
              <p className="text-sm font-medium text-[var(--color-accent)]">{assignment.topic}</p>
            )}
          </div>
          <div className="flex flex-col md:items-end gap-2 text-right">
            <div className={`flex items-center gap-2 text-sm font-bold ${isPastDue ? 'text-red-500' : 'text-[var(--color-muted)]'}`}>
              <Calendar className="w-4 h-4" />
              <span>Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString()}</span>
            </div>
            <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">
              {assignment.points} Points
            </span>
          </div>
        </div>

        <div className="mt-8 prose prose-sm max-w-none text-[var(--color-ink)]">
          {assignment.description ? (
            <p className="whitespace-pre-wrap">{assignment.description}</p>
          ) : (
            <p className="italic text-[var(--color-muted)]">No description provided.</p>
          )}
        </div>

        {assignment.attachmentUrl && (
          <div className="mt-6 p-4 rounded-xl border border-[var(--color-line)] bg-[var(--surface-2)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-500" />
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">{assignment.attachmentName || "Attached Material"}</p>
                <p className="text-xs text-[var(--color-muted)]">Reference document</p>
              </div>
            </div>
            <a 
              href={assignment.attachmentUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn--outline py-1.5 px-4 text-xs rounded-lg"
            >
              View
            </a>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-[var(--color-line)] flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-muted)]" />
            <span className="text-2xl font-black text-[var(--color-ink)]">{totalCount}</span>
            <span className="text-xs font-bold uppercase text-[var(--color-muted)]">Students</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-line)]"></div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-black text-blue-600">{submittedCount}</span>
            <span className="text-xs font-bold uppercase text-blue-600/70">Submitted</span>
          </div>
          <div className="w-px h-8 bg-[var(--color-line)]"></div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-black text-emerald-600">{gradedCount}</span>
            <span className="text-xs font-bold uppercase text-emerald-600/70">Graded</span>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card shadow-xl border border-[var(--color-line)] bg-[var(--surface-1)]">
        <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)] rounded-t-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">Student Submissions</h2>
        </div>
        
        <div className="divide-y divide-[var(--color-line)]">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-muted)]">
              No students enrolled in this class.
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.studentId} className="p-4 md:p-6 flex flex-col lg:flex-row gap-6">
                
                {/* Student Info */}
                <div className="w-full lg:w-1/4">
                  <h3 className="font-bold text-[var(--color-ink)]">{sub.studentName}</h3>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">{sub.studentCode}</p>
                  
                  <div className="mt-3">
                    {sub.status === 'Not Submitted' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">
                        <AlertCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                    {sub.status === 'Submitted' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">
                        <FileCheck2 className="w-3 h-3" /> Submitted
                      </span>
                    )}
                    {sub.status === 'Graded' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                        <FileCheck2 className="w-3 h-3" /> Graded
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Content */}
                <div className="w-full lg:w-2/4 space-y-4">
                  {sub.status === 'Not Submitted' ? (
                    <div className="h-full flex items-center justify-center p-6 border border-dashed border-[var(--color-line)] rounded-xl bg-[var(--surface-2)] text-[var(--color-muted)] text-sm italic">
                      Student has not turned in work yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sub.content && (
                        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--color-line)]">
                          <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{sub.content}</p>
                        </div>
                      )}
                      
                      {sub.fileUrl && (
                        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--color-line)] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span className="text-sm font-bold text-[var(--color-ink)]">{sub.attachmentName || "Attached File"}</span>
                          </div>
                          <a 
                            href={sub.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-500 hover:underline px-3 py-1 bg-blue-500/10 rounded-lg"
                          >
                            Open
                          </a>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-[var(--color-muted)]">
                        Submitted at: {new Date(sub.submittedAt!).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Grading Area */}
                <div className="w-full lg:w-1/4">
                  {sub.submissionId ? (
                    <div className="h-full">
                      <GradeForm 
                        submissionId={sub.submissionId}
                        assignmentId={assignment.id}
                        maxPoints={assignment.points}
                        currentScore={sub.score}
                        currentFeedback={sub.feedback}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--color-line)] opacity-50">
                      <p className="text-xs text-[var(--color-muted)] text-center">Cannot grade until submitted.</p>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
