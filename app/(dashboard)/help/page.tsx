"use client";

import { useEffect, useState } from "react";
import { t, type AppLanguage } from "@/lib/i18n";

export default function HelpCenterPage() {
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!problemType || !description) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemType, description }),
      });

      if (!response.ok) throw new Error(t("help.somethingWrong", activeLang));

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setProblemType("");
        setDescription("");
      }, 6000);
    } catch {
      setError(t("help.somethingWrong", activeLang));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("help.title", activeLang)}</h1>
          <p className="page-subtitle">{t("help.subtitle", activeLang)}</p>
        </div>
      </div>

      <article className="card max-w-3xl">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-green)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-green-light)_72%,transparent)] text-[color-mix(in_srgb,var(--color-green)_88%,white)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">
              {t("help.submitted", activeLang)}
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
              {t("help.thankYou", activeLang)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-section space-y-2">
              <label htmlFor="problemType" className="field-label">
                {t("help.typeOfProblem", activeLang)}
              </label>
              <select
                id="problemType"
                value={problemType}
                onChange={(event) => setProblemType(event.target.value)}
                required
                className="field-input"
              >
                <option value="" disabled>
                  {t("help.selectCategory", activeLang)}
                </option>
                <option value="camera">{t("help.cameraIssue", activeLang)}</option>
                <option value="attendance">{t("help.attendanceIssue", activeLang)}</option>
                <option value="dashboard">{t("help.dashboardIssue", activeLang)}</option>
                <option value="student_profile">{t("help.profileIssue", activeLang)}</option>
                <option value="system_crash">{t("help.crash", activeLang)}</option>
                <option value="other">{t("help.other", activeLang)}</option>
              </select>
            </div>

            <div className="form-section space-y-2">
              <label htmlFor="description" className="field-label">
                {t("help.description", activeLang)}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                placeholder={t("help.descriptionPlaceholder", activeLang)}
                rows={6}
                className="field-input min-h-[150px] resize-y"
              />
            </div>

            {error ? <p className="form-message form-message--error">{error}</p> : null}

            <div className="flex justify-end">
              <button type="submit" disabled={isLoading} className="btn btn--primary">
                {isLoading
                  ? t("help.sending", activeLang)
                  : t("help.submitReport", activeLang)}
              </button>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
