"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { checkInStudentAction } from "@/app/actions/attendance";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";

export function AttendanceCheckInForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(checkInStudentAction, idleActionState);
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  useEffect(() => {
    const updateLangFromHtml = () => {
      const htmlLang = document.documentElement.lang === "ar" ? "ar" : "en";
      setActiveLang(htmlLang);
    };

    updateLangFromHtml();

    const observer = new MutationObserver(updateLangFromHtml);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <form ref={formRef} action={action} className="panel panel--dark space-y-5">
      <div className="space-y-2">
        <p className="eyebrow text-white/65">{t("checkin.desk", activeLang)}</p>
        <h1 className="section-title text-white">{t("checkin.title", activeLang)}</h1>
        <p className="section-copy text-white/70">
          {t("checkin.description", activeLang)}
        </p>
      </div>

      <div className="space-y-2">
        <label className="field-label text-white/72" htmlFor="studentCode">
          {t("checkin.studentId", activeLang)}
        </label>
        <input
          id="studentCode"
          name="studentCode"
          autoFocus
          className="field-input field-input--dark"
          placeholder={t("checkin.scanPlaceholder", activeLang)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label text-white/72" htmlFor="notes">
          {t("checkin.notes", activeLang)}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="field-input field-input--dark min-h-24"
          placeholder={t("checkin.notesPlaceholder", activeLang)}
        />
      </div>

      <SubmitButton
        label={t("checkin.markPresent", activeLang)}
        pendingLabel={t("checkin.checkingIn", activeLang)}
        className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-accent-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {state.message ? (
        <p className={`form-message form-message--${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
