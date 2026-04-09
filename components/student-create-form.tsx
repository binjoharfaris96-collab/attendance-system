"use client";

import { useActionState, useEffect, useRef } from "react";

import { createStudentAction } from "@/app/actions/students";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";
import { t, type AppLanguage } from "@/lib/i18n";

export function StudentCreateForm({ lang = "en" }: { lang?: AppLanguage }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createStudentAction, idleActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="panel space-y-5">
      <div className="space-y-1">
        <p className="eyebrow">{t("student.rosterBuilder", lang)}</p>
        <h2 className="section-title">{t("student.addStudent", lang)}</h2>
        <p className="section-copy">
          {t("student.addDescription", lang)}
        </p>
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="studentCode">
          {t("student.studentId", lang)}
        </label>
        <input
          id="studentCode"
          name="studentCode"
          className="field-input"
          placeholder={t("student.studentIdPlaceholder", lang)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="fullName">
          {t("student.fullName", lang)}
        </label>
        <input
          id="fullName"
          name="fullName"
          className="field-input"
          placeholder={t("student.fullNamePlaceholder", lang)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="className">
          {t("student.classOrGroup", lang)}
        </label>
        <input
          id="className"
          name="className"
          className="field-input"
          placeholder={t("student.classPlaceholder", lang)}
        />
      </div>

      <SubmitButton
        label={t("student.addToRoster", lang)}
        pendingLabel={t("student.adding", lang)}
        className="rounded-2xl bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--color-ink)_90%,white)] disabled:cursor-not-allowed disabled:opacity-70"
      />

      {state.message ? (
        <p className={`form-message form-message--${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
