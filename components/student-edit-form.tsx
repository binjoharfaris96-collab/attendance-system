"use client";

import { useActionState } from "react";

import { updateStudentAction, deleteStudentAction } from "@/app/actions/students";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";
import type { Student } from "@/lib/types";
import { t, type AppLanguage } from "@/lib/i18n";

type StudentEditFormProps = {
  student: Student;
  lang?: AppLanguage;
};

export function StudentEditForm({ student, lang = "en" }: StudentEditFormProps) {
  const updateAction = updateStudentAction.bind(null, student.id);
  const [state, action] = useActionState(updateAction, idleActionState);

  return (
    <form action={action} className="card space-y-5">
      <div>
        <div className="mb-4 flex items-center gap-3">
          {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="h-16 w-16 rounded-full border-2 border-[var(--color-line)] object-cover"
              />
          ) : (
            <span className="avatar avatar--lg">
              {student.fullName.charAt(0)}
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-ink)]">
              {student.fullName}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              {student.studentCode}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="studentCode">
            {t("student.studentId", lang)}
          </label>
          <input
            id="studentCode"
            name="studentCode"
            defaultValue={student.studentCode}
            className="field-input"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="field-label" htmlFor="className">
            {t("student.class", lang)}
          </label>
          <input
            id="className"
            name="className"
            defaultValue={student.className ?? ""}
            className="field-input"
            placeholder={t("student.classPlaceholder", lang)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="field-label" htmlFor="fullName">
          {t("student.fullName", lang)}
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={student.fullName}
          className="field-input"
          required
        />
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-line)] pt-5">
        <SubmitButton
          label={t("student.saveChanges", lang)}
          pendingLabel={t("student.saving", lang)}
          className="btn btn--primary flex-1"
        />
        {state.message && state.status !== "success" ? (
          <p className={`form-message form-message--${state.status}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function StudentDeleteForm({ studentId, lang = "en" }: { studentId: string; lang?: AppLanguage }) {
  // A completely separate form so it doesn't trigger HTML validation on the parent inputs.
  const deleteAction = deleteStudentAction.bind(null, studentId);
  return (
    <form
      action={() => {
        if (confirm(t("student.deleteWarning", lang))) {
          deleteAction();
          // We force a redirect after, or NextJS revalidates.
          // Usually we redirect back to /students
          window.location.href = '/students';
        }
      }}
      className="card mt-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color-mix(in_srgb,var(--color-red)_88%,white)]">{t("student.dangerZone", lang)}</h2>
          <p className="text-sm text-[var(--color-muted)]">{t("student.deleteWarning", lang)}</p>
        </div>
        <button type="submit" className="btn btn--danger">
          {t("student.deleteProfile", lang)}
        </button>
      </div>
    </form>
  );
}
