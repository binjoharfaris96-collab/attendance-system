import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Inbox,
  MessageCircle,
  MoreVertical,
  Send,
  UserPlus,
} from "lucide-react";

import { addAssignmentCommentAction } from "@/app/actions/assignments";
import { GradeForm } from "@/components/teacher/grade-form";
import { StudentWorkReviewShell } from "@/components/teacher/student-work-review-shell";
import { requireSession } from "@/lib/auth";
import {
  getAssignmentById,
  getAssignmentComments,
  getAssignmentSubmissions,
  getTeacherByUserId,
  getTeacherClasses,
  getUserByEmail,
} from "@/lib/db";

type SearchParams = {
  tab?: string;
  status?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function DetailTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-12 shrink-0 items-center border-b-2 px-3 text-sm font-bold transition-colors ${
        active
          ? "border-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Graded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-green-light)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-green)]">
        <CheckCircle2 className="h-3 w-3" />
        Marked
      </span>
    );
  }

  if (status === "Submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-light)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-accent)]">
        <Inbox className="h-3 w-3" />
        Handed in
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-red-light)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-red)]">
      <AlertCircle className="h-3 w-3" />
      Assigned
    </span>
  );
}

export default async function TeacherAssignmentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { tab = "instructions", status = "all" } = await searchParams;
  const activeTab = tab === "student-work" ? "student-work" : "instructions";

  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return notFound();

  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return notFound();

  const assignment = await getAssignmentById(id);
  if (!assignment) return notFound();

  const teacherClasses = await getTeacherClasses(teacher.id);
  if (!teacherClasses.some((schoolClass) => schoolClass.id === assignment.classId)) {
    return notFound();
  }

  const [submissions, comments] = await Promise.all([
    getAssignmentSubmissions(id),
    getAssignmentComments(id),
  ]);

  const handedInCount = submissions.filter(
    (submission) => submission.status === "Submitted" || submission.status === "Graded",
  ).length;
  const markedCount = submissions.filter((submission) => submission.status === "Graded").length;
  const assignedCount = Math.max(submissions.length - handedInCount, 0);
  const filteredSubmissions = submissions.filter((submission) => {
    if (status === "handed-in") return submission.status === "Submitted";
    if (status === "marked") return submission.status === "Graded";
    if (status === "assigned") return submission.status === "Not Submitted";
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-3 border-b border-[var(--color-line)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {assignment.className}
            </p>
            <h1 className="truncate text-2xl font-black text-[var(--color-ink)]">
              {assignment.title}
            </h1>
          </div>
          <MoreVertical className="h-5 w-5 text-[var(--color-muted)]" />
        </div>
        <div className="flex gap-5 overflow-x-auto">
          <DetailTab href={`/teacher/assignments/${id}?tab=instructions`} active={activeTab === "instructions"}>
            Instructions
          </DetailTab>
          <DetailTab href={`/teacher/assignments/${id}?tab=student-work`} active={activeTab === "student-work"}>
            Student work
          </DetailTab>
        </div>
      </div>

      {activeTab === "instructions" ? (
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="grid gap-4 md:grid-cols-[48px_1fr_120px]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-green-light)] text-[var(--color-green)]">
              <FileText className="h-6 w-6" />
            </span>
            <div className="min-w-0 space-y-3">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[var(--color-ink)]">
                  {assignment.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {user.fullName || user.email} · Posted {formatDate(assignment.createdAt)}
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                  {assignment.points} points · Due {formatDate(assignment.dueDate)}
                </p>
              </div>

              <div className="border-t border-[var(--color-line)] pt-5">
                {assignment.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-ink)]">
                    {assignment.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-[var(--color-muted)]">
                    No instructions were added.
                  </p>
                )}
              </div>

              {assignment.attachmentUrl ? (
                <a
                  href={assignment.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex max-w-md items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--surface-1)] p-3 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <FileText className="h-6 w-6 text-[var(--color-accent)]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--color-ink)]">
                      {assignment.attachmentName || "Attached material"}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">Reference file</span>
                  </span>
                </a>
              ) : null}

              <section className="border-t border-[var(--color-line)] pt-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                  <MessageCircle className="h-4 w-4" />
                  Class comments
                </div>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-[var(--surface-1)] p-3">
                      <p className="text-xs font-bold text-[var(--color-ink)]">
                        {comment.authorName}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                  <form action={addAssignmentCommentAction} className="flex items-center gap-3">
                    <input type="hidden" name="assignmentId" value={assignment.id} />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                    <input
                      name="content"
                      className="input min-w-0 flex-1 bg-[var(--surface-1)]"
                      placeholder="Add class comment..."
                    />
                    <button type="submit" className="floating-action h-10 w-10">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </section>
            </div>
            <div className="hidden justify-end md:flex">
              <MoreVertical className="h-5 w-5 text-[var(--color-muted)]" />
            </div>
          </section>
        </div>
      ) : (
        <StudentWorkReviewShell
          assignmentId={assignment.id}
          acceptingSubmissions={assignment.acceptingSubmissions}
          status={status}
          submissions={filteredSubmissions.map((submission) => ({
            studentId: submission.studentId,
            studentName: submission.studentName,
            studentCode: submission.studentCode,
            submissionId: submission.submissionId,
            status: submission.status,
          }))}
        >
            <section className="p-6 lg:p-8">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                    {assignment.title}
                  </h2>
                  <div className="mt-4 grid w-full max-w-sm grid-cols-3 divide-x divide-[var(--color-line)] text-center">
                    <div>
                      <p className="text-3xl font-semibold text-[var(--color-ink)]">{handedInCount}</p>
                      <p className="text-xs text-[var(--color-muted)]">Handed in</p>
                    </div>
                    <div>
                      <p className="text-3xl font-semibold text-[var(--color-ink)]">{assignedCount}</p>
                      <p className="text-xs text-[var(--color-muted)]">Assigned</p>
                    </div>
                    <div>
                      <p className="text-3xl font-semibold text-[var(--color-ink)]">{markedCount}</p>
                      <p className="text-xs text-[var(--color-muted)]">Marked</p>
                    </div>
                  </div>
                </div>
                <button type="button" className="btn btn--outline inline-flex w-fit items-center gap-2">
                  All
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                  <Inbox className="mb-4 h-20 w-20 text-[var(--color-muted)] opacity-40" />
                  <p className="max-w-xs font-bold text-[var(--color-ink)]">
                    This has not been assigned to any students
                  </p>
                  <Link
                    href="/teacher/classes"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-accent)]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite students
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => (
                    <article key={submission.studentId} className="card p-4">
                      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            <h3 className="font-bold text-[var(--color-ink)]">
                              {submission.studentName}
                            </h3>
                            <StatusBadge status={submission.status} />
                            {submission.returnedAt ? (
                              <span className="text-xs font-bold text-[var(--color-muted)]">
                                Returned {formatDate(submission.returnedAt)}
                              </span>
                            ) : null}
                          </div>
                          {submission.status === "Not Submitted" ? (
                            <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--surface-2)] p-5 text-sm text-[var(--color-muted)]">
                              Student has not turned in work yet.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {submission.content ? (
                                <div className="rounded-lg bg-[var(--surface-2)] p-4 text-sm text-[var(--color-ink)]">
                                  {submission.content}
                                </div>
                              ) : null}
                              {submission.fileUrl ? (
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--surface-2)] p-3 text-sm font-bold text-[var(--color-ink)]"
                                >
                                  <span className="flex min-w-0 items-center gap-2">
                                    <FileText className="h-5 w-5 text-[var(--color-accent)]" />
                                    <span className="truncate">
                                      {submission.attachmentName || "Attached file"}
                                    </span>
                                  </span>
                                  <span className="text-[var(--color-accent)]">Open</span>
                                </a>
                              ) : null}
                              <p className="text-xs text-[var(--color-muted)]">
                                Submitted {submission.submittedAt ? formatDate(submission.submittedAt) : ""}
                              </p>
                            </div>
                          )}
                        </div>
                        {submission.submissionId ? (
                          <GradeForm
                            submissionId={submission.submissionId}
                            assignmentId={assignment.id}
                            maxPoints={assignment.points}
                            currentScore={submission.score}
                            currentFeedback={submission.feedback}
                          />
                        ) : (
                          <div className="flex items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--surface-2)] p-4 text-center text-xs text-[var(--color-muted)]">
                            Grade after the student submits work.
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
        </StudentWorkReviewShell>
      )}
    </div>
  );
}
