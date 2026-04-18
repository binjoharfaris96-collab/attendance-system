import Link from "next/link";

import { MisbehaviorForm } from "@/components/misbehavior-form";
import { formatDateTime } from "@/lib/time";
import { listRecentMisbehaviorReports, listStudents } from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { requireSession } from "@/lib/auth";

function translateIssueTypeLabel(issueType: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    "Class disruption": "behavior.classDisruption",
    "Disrespectful behavior": "behavior.disrespectful",
    Bullying: "behavior.bullying",
    Fighting: "behavior.fighting",
    "Phone misuse": "behavior.phoneMisuse",
    Cheating: "behavior.cheating",
    "Skipping class": "behavior.skipping",
    "Property damage": "behavior.propertyDamage",
    Other: "behavior.other",
  };

  const key = map[issueType];
  return key ? t(key) : issueType;
}

export default async function BehaviorPage() {
  const students = await listStudents();
  const reports = await listRecentMisbehaviorReports(60);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  const session = await requireSession();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("behavior.title")}</h1>
          <p className="page-subtitle">
            {t("behavior.subtitle")}
          </p>
        </div>
      </div>

      <div className={`grid gap-6 ${session.role === "admin" ? "lg:grid-cols-[420px_1fr]" : "max-w-2xl mx-auto"}`}>
        <div className="card h-fit">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
            {t("behavior.reportMisbehavior")}
          </h3>
          <MisbehaviorForm students={students} lang={lang} />
        </div>

        {session.role === "admin" && (
          <div className="card">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
            {t("behavior.recentReports")}
          </h3>

          {reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              {t("behavior.noReports")}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="list-row p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/students/${report.studentId}`}
                        className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                      >
                        {report.studentName}
                      </Link>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">
                        {report.studentCode} | {report.className ?? t("common.unassigned")}
                      </p>
                    </div>
                    <span className="badge badge--amber">
                      {translateIssueTypeLabel(report.issueType, t)}
                    </span>
                  </div>

                  {report.notes ? (
                    <p className="mt-3 text-sm text-[var(--color-ink)]">
                      {report.notes}
                    </p>
                  ) : null}

                  <p className="mt-3 text-[11px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
                    {t("behavior.logged")} {formatDateTime(report.reportedAt)}
                    {report.reportedBy ? ` ${t("behavior.by")} ${report.reportedBy}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
