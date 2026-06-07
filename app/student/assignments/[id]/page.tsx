import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getAssignmentById, getSubmissionForStudent } from "@/lib/db";
import { notFound } from "next/navigation";
import { FileText, Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { SubmissionForm } from "@/components/student/submission-form";

export default async function StudentAssignmentDetail({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return notFound();

  const student = await getStudentByUserId(user.id);
  if (!student) return notFound();

  const assignment = await getAssignmentById(params.id);
  if (!assignment) return notFound();

  const submission = await getSubmissionForStudent(params.id, student.id);

  const dueDate = new Date(assignment.dueDate);
  const isPastDue = dueDate < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6 shadow-xl border-t-4 border-t-blue-500 bg-[var(--surface-1)]">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase rounded-md">
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
      </div>

      {submission ? (
        <div className="card p-6 shadow-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-emerald-600">Work Submitted</h2>
              <p className="mt-1 text-xs font-mono text-emerald-600/70">Submitted on {new Date(submission.submittedAt || submission.gradedAt || new Date()).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {submission.content && (
              <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--color-line)]">
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{submission.content}</p>
              </div>
            )}
            
            {submission.fileUrl && (
              <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--color-line)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-bold text-[var(--color-ink)]">{submission.attachmentName || "Attached File"}</span>
                </div>
                <a 
                  href={submission.fileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-500 hover:underline"
                >
                  Open
                </a>
              </div>
            )}

            {submission.score !== null && (
              <div className="mt-6 pt-6 border-t border-emerald-500/20">
                <h3 className="text-sm font-black uppercase text-[var(--color-muted)] mb-3">Teacher Feedback</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-black text-emerald-600">
                    {submission.score} <span className="text-sm text-emerald-600/50">/ {assignment.points}</span>
                  </div>
                </div>
                {submission.feedback && (
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 text-sm italic text-[var(--color-ink)]">
                    "{submission.feedback}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 shadow-xl border border-[var(--color-line)] bg-[var(--surface-1)]">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Submit Your Work</h2>
          </div>
          <SubmissionForm assignmentId={assignment.id} />
        </div>
      )}
    </div>
  );
}
