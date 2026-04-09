"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { submitMisbehaviorAction } from "@/app/actions/misbehavior";
import { t, type AppLanguage } from "@/lib/i18n";
import type { StudentListItem } from "@/lib/types";

const ISSUE_TYPES = [
  { value: "Class disruption", key: "behavior.classDisruption" },
  { value: "Disrespectful behavior", key: "behavior.disrespectful" },
  { value: "Bullying", key: "behavior.bullying" },
  { value: "Fighting", key: "behavior.fighting" },
  { value: "Phone misuse", key: "behavior.phoneMisuse" },
  { value: "Cheating", key: "behavior.cheating" },
  { value: "Skipping class", key: "behavior.skipping" },
  { value: "Property damage", key: "behavior.propertyDamage" },
  { value: "Other", key: "behavior.other" },
] as const;

function normalizeClassName(value: string | null, lang: AppLanguage) {
  return value?.trim() || t("common.unassigned", lang);
}

export function MisbehaviorForm({
  students,
  lang = "en",
}: {
  students: StudentListItem[];
  lang?: AppLanguage;
}) {
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

  const classOptions = useMemo(() => {
    return Array.from(
      new Set(
        students.map((student) => normalizeClassName(student.className, activeLang)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [activeLang, students]);

  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return students
      .filter(
        (student) =>
          normalizeClassName(student.className, activeLang) === selectedClass,
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [activeLang, selectedClass, students]);

  function handleClassChange(value: string) {
    setSelectedClass(value);
    setSelectedStudentId("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitMisbehaviorAction(formData);

      if (result.success) {
        setIsSuccess(true);
        setMessage(result.message || t("behavior.reportSubmitted", activeLang));
        formRef.current?.reset();
        setSelectedClass("");
        setSelectedStudentId("");
      } else {
        setIsSuccess(false);
        setMessage(result.error || t("behavior.reportFailed", activeLang));
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("behavior.problemType", activeLang)}
        </label>
        <select name="issueType" className="field-input w-full" required defaultValue="">
          <option value="" disabled>
            {t("behavior.selectIssue", activeLang)}
          </option>
          {ISSUE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.key, activeLang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("behavior.class", activeLang)}
        </label>
        <select
          name="className"
          value={selectedClass}
          onChange={(event) => handleClassChange(event.target.value)}
          className="field-input w-full"
          required
        >
          <option value="" disabled>
            {t("behavior.selectClass", activeLang)}
          </option>
          {classOptions.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("table.student", activeLang)}
        </label>
        <select
          name="studentId"
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
          className="field-input w-full"
          required
          disabled={!selectedClass}
        >
          <option value="" disabled>
            {selectedClass
              ? t("behavior.selectStudent", activeLang)
              : t("behavior.selectClassFirst", activeLang)}
          </option>
          {studentsInSelectedClass.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} ({student.studentCode})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("behavior.notesOptional", activeLang)}
        </label>
        <textarea
          name="notes"
          className="field-input w-full min-h-[90px]"
          placeholder={t("behavior.extraDetails", activeLang)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn btn--primary w-full justify-center"
      >
        {isPending
          ? t("behavior.submitting", activeLang)
          : t("behavior.submitReport", activeLang)}
      </button>

      {message ? (
        <p className={`form-message ${isSuccess ? "form-message--success" : "form-message--error"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
