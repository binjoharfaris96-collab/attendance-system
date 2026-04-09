"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { submitExcuseAction } from "@/app/actions/excuse";
import { t, type AppLanguage } from "@/lib/i18n";
import type { StudentListItem } from "@/lib/types";

export function ExcuseForm({
  students,
  lang = "en",
}: {
  students: StudentListItem[];
  lang?: AppLanguage;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitExcuseAction(formData);
      if (result.success) {
        setIsSuccess(true);
        setMessage(t("excuse.success", activeLang));
        formRef.current?.reset();
        setTimeout(() => setMessage(""), 4000);
      } else {
        setIsSuccess(false);
        setMessage(t("excuse.failed", activeLang));
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          {t("excuse.student", activeLang)}
        </label>
        <select name="studentId" className="field-input w-full" required defaultValue="">
          <option value="" disabled>
            {t("excuse.selectStudent", activeLang)}
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} ({student.studentCode})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          {t("excuse.dateOfAbsence", activeLang)}
        </label>
        <input type="date" name="date" className="field-input w-full" required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          {t("excuse.reasonNotes", activeLang)}
        </label>
        <textarea
          name="reason"
          className="field-input w-full min-h-[80px]"
          placeholder={t("excuse.reasonPlaceholder", activeLang)}
          required
        />
      </div>

      <button type="submit" disabled={isPending} className="btn btn--primary w-full justify-center">
        {isPending
          ? t("excuse.submitting", activeLang)
          : t("excuse.submit", activeLang)}
      </button>

      {message ? (
        <p className={`form-message ${isSuccess ? "form-message--success" : "form-message--error"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
