import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Folder,
  GraduationCap,
  Inbox,
  Layers3,
  MessageSquare,
  MoreVertical,
  Send,
} from "lucide-react";

import { requireSession } from "@/lib/auth";
import {
  getLatestAnnouncementsForRole,
  getTeacherAssignments,
  getTeacherByUserId,
  getTeacherClasses,
  getUserByEmail,
} from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { AssignmentForm } from "@/components/teacher/assignment-form";
import { StreamForm } from "@/components/teacher/stream-form";

type SearchParams = {
  tab?: string;
  classId?: string;
};

function formatDueDate(value: string | null | undefined) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isDueSoon(value: string | null | undefined) {
  if (!value) return false;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;
  const now = Date.now();
  const sevenDays = 1000 * 60 * 60 * 24 * 7;
  return dueDate.getTime() >= now && dueDate.getTime() <= now + sevenDays;
}

function countAssigned(assignment: {
  totalStudents: number;
  submittedCount: number;
}) {
  return Math.max(assignment.totalStudents - assignment.submittedCount, 0);
}

function isFullyReviewed(assignment: {
  submittedCount: number;
  reviewedCount: number;
}) {
  return assignment.submittedCount > 0 && assignment.reviewedCount >= assignment.submittedCount;
}

function TabLink({
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

function ClassFilter({
  tab,
  classId,
  classes,
}: {
  tab: string;
  classId: string;
  classes: { id: string; name: string }[];
}) {
  return (
    <form className="w-full max-w-sm">
      <input type="hidden" name="tab" value={tab} />
      <select
        name="classId"
        defaultValue={classId}
        className="input h-14 w-full border-2 border-[var(--color-accent)] bg-[var(--surface-1)] text-sm font-semibold text-[var(--color-ink)]"
        aria-label="Filter assignments by class"
      >
        <option value="">All classes</option>
        {classes.map((schoolClass) => (
          <option key={schoolClass.id} value={schoolClass.id}>
            {schoolClass.name}
          </option>
        ))}
      </select>
      <button type="submit" className="sr-only">
        Apply
      </button>
    </form>
  );
}

function AssignmentReviewRow({
  assignment,
}: {
  assignment: {
    id: string;
    title: string;
    createdAt: string;
    className: string;
    totalStudents: number;
    submittedCount: number;
    markedCount: number;
    reviewedCount: number;
    type: string;
    dueDate: string;
  };
}) {
  return (
    <Link
      href={`/teacher/assignments/${assignment.id}?tab=student-work`}
      className="grid gap-4 rounded-lg border border-transparent px-3 py-4 transition-colors hover:border-[var(--color-line)] hover:bg-[var(--surface-2)] md:grid-cols-[1fr_340px_32px]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-light)] text-[var(--color-green)]">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--color-ink)]">
            {assignment.title}
          </p>
          <p className="truncate text-xs text-[var(--color-muted)]">
            {assignment.className} · {assignment.type} · Posted{" "}
            {formatDueDate(assignment.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-semibold text-[var(--color-ink)]">
            {assignment.submittedCount}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Handed in</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--color-ink)]">
            {countAssigned(assignment)}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Assigned</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--color-ink)]">
            {assignment.markedCount}
          </p>
          <p className="text-xs text-[var(--color-muted)]">Marked</p>
        </div>
      </div>

      <span className="hidden items-center justify-center text-[var(--color-muted)] md:flex">
        <MoreVertical className="h-5 w-5" />
      </span>
    </Link>
  );
}

function ReviewGroup({
  title,
  assignments,
}: {
  title: string;
  assignments: Array<Parameters<typeof AssignmentReviewRow>[0]["assignment"]>;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">{title}</h2>
        <span className="text-sm font-bold text-[var(--color-muted)]">
          {assignments.length}
        </span>
      </div>
      {assignments.length > 0 ? (
        <div className="divide-y divide-[var(--color-line)]">
          {assignments.map((assignment) => (
            <AssignmentReviewRow key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="px-3 py-6 text-sm text-[var(--color-muted)]">
          No work in this group.
        </div>
      )}
    </section>
  );
}

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="mx-auto mt-12 max-w-3xl p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[var(--color-red)]" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          Account Not Linked
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Your account must be linked by an administrator to manage assignments.
        </p>
      </div>
    );
  }

  const { tab = "to-review", classId = "" } = await searchParams;
  const activeTab = ["to-review", "reviewed", "stream", "classwork"].includes(tab)
    ? tab
    : "to-review";
  const classes = await getTeacherClasses(teacherProfile.id);
  const assignments = await getTeacherAssignments(teacherProfile.id);
  const announcements = await getLatestAnnouncementsForRole(
    "teacher",
    teacherProfile.buildingId,
    20,
  );

  const filteredAssignments = classId
    ? assignments.filter((assignment) => assignment.classId === classId)
    : assignments;
  const toReviewAssignments = filteredAssignments.filter(
    (assignment) => !isFullyReviewed(assignment),
  );
  const reviewedAssignments = filteredAssignments.filter(isFullyReviewed);
  const noDueDate = toReviewAssignments.filter(
    (assignment) => !assignment.dueDate || Number.isNaN(new Date(assignment.dueDate).getTime()),
  );
  const dueSoon = toReviewAssignments.filter((assignment) =>
    isDueSoon(assignment.dueDate),
  );
  const workInProgress = toReviewAssignments.filter(
    (assignment) => !noDueDate.includes(assignment) && !dueSoon.includes(assignment),
  );
  const tabQuery = classId ? `&classId=${encodeURIComponent(classId)}` : "";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Classroom workspace
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)]">
            Assignment Hub
          </h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)]">
            Review student work, post stream updates, and organize classwork from one place.
          </p>
        </div>
        <Link
          href="/assignments/guide"
          className="btn btn--outline inline-flex w-fit items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Usage Guide
        </Link>
      </div>

      <div className="overflow-x-auto border-b border-[var(--color-line)]">
        <div className="flex min-w-max gap-4">
          <TabLink href={`?tab=to-review${tabQuery}`} active={activeTab === "to-review"}>
            <ClipboardCheck className="me-2 h-4 w-4" />
            To review
          </TabLink>
          <TabLink href={`?tab=reviewed${tabQuery}`} active={activeTab === "reviewed"}>
            <CheckCircle2 className="me-2 h-4 w-4" />
            Reviewed
          </TabLink>
          <TabLink href={`?tab=stream${tabQuery}`} active={activeTab === "stream"}>
            <MessageSquare className="me-2 h-4 w-4" />
            Stream
          </TabLink>
          <TabLink href={`?tab=classwork${tabQuery}`} active={activeTab === "classwork"}>
            <Layers3 className="me-2 h-4 w-4" />
            Classwork
          </TabLink>
        </div>
      </div>

      {activeTab === "to-review" ? (
        <div className="mx-auto max-w-5xl space-y-8">
          <ClassFilter tab="to-review" classId={classId} classes={classes} />
          {toReviewAssignments.length === 0 ? (
            <div className="py-24 text-center">
              <Inbox className="mx-auto mb-4 h-14 w-14 text-[var(--color-muted)] opacity-50" />
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                Nothing to review
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Student work that needs attention will appear here.
              </p>
            </div>
          ) : (
            <>
              <ReviewGroup title="No due date" assignments={noDueDate} />
              <ReviewGroup title="Due soon" assignments={dueSoon} />
              <ReviewGroup title="Work in progress" assignments={workInProgress} />
            </>
          )}
        </div>
      ) : null}

      {activeTab === "reviewed" ? (
        <div className="mx-auto max-w-5xl space-y-8">
          <ClassFilter tab="reviewed" classId={classId} classes={classes} />
          {reviewedAssignments.length === 0 ? (
            <div className="py-24 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[var(--color-muted)] opacity-50" />
              <h2 className="text-lg font-bold text-[var(--color-ink)]">
                No reviewed work yet
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-muted)]">
                This is where work you have marked as reviewed will appear.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {reviewedAssignments.map((assignment) => (
                <AssignmentReviewRow key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "stream" ? (
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-4">
            <div className="card p-4">
              <p className="text-sm font-bold text-[var(--color-ink)]">Upcoming</p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {toReviewAssignments.length > 0
                  ? `${toReviewAssignments.length} items need review`
                  : "No work due soon"}
              </p>
            </div>
          </aside>
          <section className="space-y-5">
            <StreamForm buildingId={teacherProfile.buildingId} />
            {announcements.length === 0 ? (
              <div className="card border-dashed p-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted)] opacity-30" />
                <p className="text-sm text-[var(--color-muted)]">
                  No announcements in the stream yet.
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <article key={announcement.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                      <Send className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--color-ink)]">
                        {announcement.attachmentType === "assignment_link"
                          ? "Assignment posted"
                          : "You posted"}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatDateTime(announcement.createdAt)}
                      </p>
                      <h2 className="mt-3 font-bold text-[var(--color-ink)]">
                        {announcement.title}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
                        {announcement.content}
                      </p>
                    </div>
                    <MoreVertical className="h-5 w-5 text-[var(--color-muted)]" />
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "classwork" ? (
        <div className="mx-auto max-w-5xl space-y-8">
          <AssignmentForm classes={classes} assignments={assignments} />
          <section className="space-y-6">
            {assignments.length === 0 ? (
              <div className="card border-dashed p-12 text-center">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 text-[var(--color-muted)] opacity-30" />
                <h2 className="text-lg font-bold text-[var(--color-ink)]">
                  No classwork yet
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
                  Create an assignment, quiz, question, or material to start building this class feed.
                </p>
              </div>
            ) : (
              Object.entries(
                assignments.reduce<Record<string, typeof assignments>>((groups, assignment) => {
                  const topic = assignment.topic || "No Topic";
                  groups[topic] = groups[topic] || [];
                  groups[topic].push(assignment);
                  return groups;
                }, {}),
              ).map(([topic, topicAssignments]) => (
                <section key={topic} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Folder className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-xl font-bold text-[var(--color-ink)]">
                      {topic}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {topicAssignments.map((assignment) => (
                      <Link
                        key={assignment.id}
                        href={`/teacher/assignments/${assignment.id}`}
                        className="card flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-green-light)] text-[var(--color-green)]">
                            <FileText className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                              {assignment.title}
                            </p>
                            <p className="truncate text-xs text-[var(--color-muted)]">
                              {assignment.className} · Due {formatDueDate(assignment.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center sm:w-64">
                          <span className="text-xs text-[var(--color-muted)]">
                            {assignment.submittedCount} handed in
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {assignment.markedCount} marked
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {assignment.points} pts
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
