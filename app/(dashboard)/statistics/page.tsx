import Link from "next/link";

import { AttendanceTrendChart } from "@/components/attendance-trend-chart";
import {
  getDashboardSummary,
  getDailyAttendanceCounts,
  listStudents,
} from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const summary = getDashboardSummary();
  const dailyCounts = getDailyAttendanceCounts(14);
  const students = listStudents();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const totalStudents = summary.totalStudents;
  const presentToday = summary.todayAttendance;
  const totalInfractions = students.reduce(
    (acc, student) =>
      acc +
      (student.latesCount || 0) +
      (student.excusesCount || 0) +
      (student.breakLatesCount || 0),
    0,
  );
  const perfectAttendance = students.filter(
    (student) =>
      student.attendanceCount > 0 &&
      (student.latesCount + student.excusesCount + student.breakLatesCount) <= 3,
  ).length;

  return (
    <div className="space-y-7">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("stats.title")}</h1>
          <p className="page-subtitle">{t("stats.subtitle")}</p>
        </div>
        <Link href="/api/reports/attendance" className="btn btn--outline">
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
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("stats.exportData")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="metric-label">{t("stats.totalStudentsTracked")}</p>
          <p className="metric-value mt-3">{totalStudents}</p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("stats.presentTodayLabel")}</p>
          <p className="metric-value mt-3 text-[color-mix(in_srgb,var(--color-green)_84%,white)]">
            {presentToday}
          </p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("stats.perfectAttendance")}</p>
          <p className="metric-value mt-3 text-[color-mix(in_srgb,var(--color-teal)_86%,white)]">
            {perfectAttendance}
          </p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("stats.totalInfractions")}</p>
          <p className="metric-value mt-3 text-[color-mix(in_srgb,var(--color-amber)_92%,white)]">
            {totalInfractions}
          </p>
        </article>
      </div>

      <div className="card">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            {t("stats.attendanceTrends")}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">{t("stats.dailyPresent")}</p>
        </div>

        <AttendanceTrendChart dailyCounts={dailyCounts} lang={lang} />
      </div>
    </div>
  );
}
