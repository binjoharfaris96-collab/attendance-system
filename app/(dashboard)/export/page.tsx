import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function ExportPage() {
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("export.title")}</h1>
          <p className="page-subtitle">{t("export.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card space-y-4">
          <div>
            <p className="eyebrow">{t("export.attendanceEyebrow")}</p>
            <h3 className="section-title">{t("export.attendanceLog")}</h3>
            <p className="section-copy">{t("export.attendanceDesc")}</p>
          </div>

          <a href="/api/export-attendance" download className="btn btn--primary inline-flex w-fit items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {t("export.downloadCsv")}
          </a>
        </div>

        <div className="card flex flex-col justify-between gap-4">
          <div>
            <p className="eyebrow">{t("export.roadmap")}</p>
            <h3 className="section-title">{t("export.comingSoon")}</h3>
            <p className="section-copy">{t("export.comingSoonDesc")}</p>
          </div>

          <div className="list-row border-dashed p-4 text-sm text-[var(--color-muted)]">
            {t("export.currentFormatCsv")}
          </div>
        </div>
      </div>
    </div>
  );
}
