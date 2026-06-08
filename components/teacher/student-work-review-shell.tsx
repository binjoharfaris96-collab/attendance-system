"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Mail, RotateCcw, Settings, Users } from "lucide-react";

import {
  markReviewedAction,
  returnWorkAction,
  toggleAcceptingSubmissionsAction,
} from "@/app/actions/assignments";

type StudentWorkSubmission = {
  studentId: string | number;
  studentName: string;
  studentCode: string;
  submissionId: string | number | null;
  status: string;
};

function StudentStatusBadge({ status }: { status: string }) {
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
      <span className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-accent)]">
        Handed in
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[var(--surface-2)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--color-muted)]">
      Assigned
    </span>
  );
}

export function StudentWorkReviewShell({
  assignmentId,
  acceptingSubmissions,
  submissions,
  status,
  children,
}: {
  assignmentId: string | number;
  acceptingSubmissions: boolean;
  submissions: StudentWorkSubmission[];
  status: string;
  children: React.ReactNode;
}) {
  const actionableIds = submissions
    .map((submission) => submission.submissionId)
    .filter((submissionId): submissionId is string | number => Boolean(submissionId));
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>(actionableIds);
  const allSelected = actionableIds.length > 0 && selectedIds.length === actionableIds.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : actionableIds);
  }

  function toggleSubmission(submissionId: string | number) {
    setSelectedIds((current) =>
      current.includes(submissionId)
        ? current.filter((id) => id !== submissionId)
        : [...current, submissionId],
    );
  }

  return (
    <div className="space-y-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--surface-1)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-line)] bg-[var(--surface-2)] p-3">
        <form action={returnWorkAction}>
          <input type="hidden" name="assignmentId" value={assignmentId} />
          {selectedIds.map((submissionId) => (
            <input key={submissionId} type="hidden" name="submissionId" value={submissionId} />
          ))}
          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="btn btn--outline inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4" />
            Return
          </button>
        </form>
        <form action={markReviewedAction}>
          <input type="hidden" name="assignmentId" value={assignmentId} />
          {selectedIds.map((submissionId) => (
            <input key={submissionId} type="hidden" name="submissionId" value={submissionId} />
          ))}
          <button
            type="submit"
            disabled={selectedIds.length === 0}
            className="btn btn--outline inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark reviewed
          </button>
        </form>
        <button className="floating-action h-10 w-10" type="button" aria-label="Email students">
          <Mail className="h-4 w-4" />
        </button>
        <form action={toggleAcceptingSubmissionsAction} className="ms-auto flex items-center gap-3">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="accepting" value={acceptingSubmissions ? "false" : "true"} />
          <span className="text-sm font-medium text-[var(--color-ink)]">
            Accepting submissions
          </span>
          <button
            type="submit"
            className={`relative h-8 w-14 rounded-full transition-colors ${
              acceptingSubmissions ? "bg-[var(--color-accent)]" : "bg-[var(--surface-1)]"
            }`}
            aria-pressed={acceptingSubmissions}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                acceptingSubmissions ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </form>
        <Settings className="h-5 w-5 text-[var(--color-muted)]" />
      </div>

      <div className="grid min-h-[620px] lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-[var(--color-line)] bg-[var(--surface-1)] p-4 lg:border-b-0 lg:border-e">
          <div className="mb-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={actionableIds.length === 0}
              className="h-5 w-5 accent-[var(--color-accent)]"
            />
            <Users className="h-5 w-5 text-[var(--color-muted)]" />
            <span className="text-sm font-bold text-[var(--color-ink)]">All students</span>
          </div>
          <form className="mb-5">
            <input type="hidden" name="tab" value="student-work" />
            <select
              name="status"
              defaultValue={status}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="input h-14 w-full bg-[var(--surface-2)] font-semibold"
            >
              <option value="all">Sort by status</option>
              <option value="handed-in">Handed in</option>
              <option value="assigned">Assigned</option>
              <option value="marked">Marked</option>
            </select>
          </form>
          <div className="space-y-1">
            {submissions.map((submission) => (
              <label
                key={submission.studentId}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--surface-2)]"
              >
                <input
                  type="checkbox"
                  value={submission.submissionId || ""}
                  disabled={!submission.submissionId}
                  checked={Boolean(
                    submission.submissionId && selectedIds.includes(submission.submissionId),
                  )}
                  onChange={() => {
                    if (submission.submissionId) toggleSubmission(submission.submissionId);
                  }}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--color-ink)]">
                    {submission.studentName}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {submission.studentCode}
                  </span>
                </span>
                <StudentStatusBadge status={submission.status} />
              </label>
            ))}
          </div>
        </aside>

        {children}
      </div>
    </div>
  );
}
