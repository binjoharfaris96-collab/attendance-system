import Link from "next/link";
import Image from "next/image";

import {
  getDashboardSummary,
  listRecentAttendance,
  listStudents,
} from "@/lib/db";
import { formatDateTime, toAttendanceDate, isoNow } from "@/lib/time";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = getDashboardSummary();
  const recentAttendance = listRecentAttendance(5);
  const students = listStudents();
  const studentPhotoById = new Map(
    students.map((student) => [student.id, student.photoUrl]),
  );
  const todayStr = toAttendanceDate(isoNow());
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  const numberFormatter = new Intl.NumberFormat(lang === "ar" ? "ar" : "en");
  const percentFormatter = new Intl.NumberFormat(lang === "ar" ? "ar" : "en", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const presentToday = summary.todayAttendance;
  const totalStudents = summary.totalStudents;
  const absentToday = Math.max(totalStudents - presentToday, 0);
  const totalLates = students.reduce(
    (acc, student) => acc + Number(student.latesCount || 0),
    0,
  );
  const attendanceRate = totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;

  function calculateAbsentDays(createdAt: string, presentCount: number) {
    const start = new Date(createdAt);
    const now = new Date();
    let weekdays = 0;
    const cur = new Date(start);
    while(cur <= now) {
      const day = cur.getDay();
      if (day !== 5 && day !== 6) weekdays++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(0, weekdays - presentCount);
  }

  function calculateOverallGrade(sum: number) {
    if (sum >= 28) return 7;
    if (sum >= 26) return 6;
    if (sum >= 24) return 5;
    if (sum >= 22) return 4;
    if (sum >= 20) return 3;
    if (sum >= 18) return 2;
    if (sum >= 16) return 1;
    return 0;
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("dashboard.title")}</h1>
          <p className="page-subtitle">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/recognition" className="btn btn--primary">
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
            <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
          {t("dashboard.launchScanner")}
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="metric-card">
          <p className="metric-label">{t("dashboard.totalStudents")}</p>
          <svg className="metric-icon" style={{ opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          <p className="metric-value">{numberFormatter.format(totalStudents)}</p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("dashboard.presentToday")}</p>
          <svg className="metric-icon" style={{ opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
          </svg>
          <p className="metric-value text-[color-mix(in_srgb,var(--color-green)_84%,white)]">{numberFormatter.format(presentToday)}</p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("dashboard.absentToday")}</p>
          <svg className="metric-icon" style={{ opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" />
          </svg>
          <p className="metric-value text-[color-mix(in_srgb,var(--color-red)_86%,white)]">{numberFormatter.format(absentToday)}</p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("dashboard.attendanceRate")}</p>
          <svg className="metric-icon" style={{ opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="metric-value text-[color-mix(in_srgb,var(--color-accent)_88%,white)]">{percentFormatter.format(attendanceRate)}%</p>
        </article>

        <article className="metric-card">
          <p className="metric-label">{t("dashboard.totalLates")}</p>
          <svg className="metric-icon" style={{ opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="metric-value text-[color-mix(in_srgb,var(--color-amber)_90%,white)]">{numberFormatter.format(totalLates)}</p>
        </article>
      </div>

      {/* Bottom panels */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Live Attendance Feed */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t("dashboard.liveAttendanceFeed")}
            </h2>
            <Link
              href="/attendance"
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]"
            >
              {t("dashboard.viewAll")}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
          </div>

          {recentAttendance.length > 0 ? (
            <div className="space-y-3">
              {recentAttendance.map((event) => (
                <Link
                  href={`/students/${event.studentId}`}
                  key={event.id}
                  className="list-row group flex cursor-pointer items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {studentPhotoById.get(event.studentId) ? (
                      <Image
                        src={studentPhotoById.get(event.studentId)!}
                        alt={`${event.fullNameSnapshot} profile`}
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 rounded-full border border-[var(--color-line)] object-cover"
                      />
                    ) : (
                      <span className="avatar">
                        {event.fullNameSnapshot.charAt(0)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
                        {event.fullNameSnapshot}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {event.studentCodeSnapshot}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge--green !bg-transparent">{t("status.present")}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {formatDateTime(event.capturedAt).split(",").pop()?.trim() ??
                        formatDateTime(event.capturedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-line)] py-10 text-center text-sm text-[var(--color-muted)]">
              {t("dashboard.noAttendanceYet")}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-ink)]">
            {t("dashboard.quickActions")}
          </h2>

          <div className="space-y-3">
            <Link
              href="/students"
              className="list-row flex items-center gap-3 px-5 py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[color-mix(in_srgb,var(--color-accent)_86%,white)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {t("dashboard.registerNewStudent")}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {t("dashboard.addFaceToSystem")}
                </p>
              </div>
            </Link>

            <Link
              href="/statistics"
              className="list-row flex items-center gap-3 px-5 py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-teal)_16%,transparent)] text-[color-mix(in_srgb,var(--color-teal)_86%,white)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {t("dashboard.viewStatistics")}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {t("dashboard.checkAttendanceTrends")}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Student Performance table */}
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t("dashboard.studentPerformance")}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {t("dashboard.reviewRates")}
            </p>
          </div>
          <input
            type="text"
            placeholder={t("dashboard.searchStudents")}
            className="search-input max-w-[14rem]"
          />
        </div>

        {students.length > 0 ? (
          <div className="table-shell overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("table.student")}</th>
                  <th className="text-center">{t("table.today")}</th>
                  <th className="text-center">{t("table.absences")}</th>
                  <th className="text-center">{t("table.lates")}</th>
                  <th className="text-center">{t("table.excuses")}</th>
                  <th className="text-center">{t("table.breakLates")}</th>
                  <th className="text-center">{t("table.overall")}</th>
                  <th className="text-center">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const absDays = calculateAbsentDays(student.createdAt, student.attendanceCount);
                  const gradeA = Math.max(0, 8 - absDays);
                  const gradeB = Math.max(0, 8 - student.latesCount);
                  const gradeC = Math.max(0, 8 - student.excusesCount);
                  const gradeD = Math.max(0, 8 - student.breakLatesCount);
                  
                  const totalGradeSum = gradeA + gradeB + gradeC + gradeD;
                  const overallGrade = calculateOverallGrade(totalGradeSum);
                  const isFailing = overallGrade < 4 || gradeA < 5 || gradeB < 5 || gradeC < 5 || gradeD < 5;

                  return (
                    <tr key={student.id} className="student-hover-row">
                      <td>
                        <Link
                          href={`/students/${student.id}`}
                          className="student-hover-target group flex items-center gap-3"
                        >
                          {student.photoUrl ? (
                            <Image
                              src={student.photoUrl}
                              alt={`${student.fullName} profile`}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-10 w-10 rounded-full border border-[var(--color-line)] object-cover"
                            />
                          ) : (
                            <span className="avatar">
                              {student.fullName.charAt(0)}
                            </span>
                          )}
                          <div>
                            <p className="student-hover-name font-medium text-[var(--color-ink)] transition-colors">
                              {student.fullName}
                            </p>
                            <p className="text-xs text-[var(--color-muted)]">
                              {student.studentCode} | {student.className}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-center">
                        {student.lastAttendanceAt && toAttendanceDate(student.lastAttendanceAt) === todayStr ? (
                          <span className="badge badge--green block w-max mx-auto px-3 !bg-transparent">{t("status.present")}</span>
                        ) : (
                          <span className="badge badge--red block w-max mx-auto px-3 !bg-transparent">{t("status.absent")}</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-sm font-bold text-[color-mix(in_srgb,var(--color-red)_86%,white)]">
                          {absDays}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {t("table.grade")}: <span className="font-semibold text-[var(--color-ink)]">{gradeA}/8</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-sm font-bold text-[color-mix(in_srgb,var(--color-amber)_92%,white)]">
                          {student.latesCount}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {t("table.grade")}: <span className="font-semibold text-[var(--color-ink)]">{gradeB}/8</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-sm font-bold text-[color-mix(in_srgb,var(--color-accent)_88%,white)]">
                          {student.excusesCount}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {t("table.grade")}: <span className="font-semibold text-[var(--color-ink)]">{gradeC}/8</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-sm font-bold text-[color-mix(in_srgb,var(--color-teal)_88%,white)]">
                          {student.breakLatesCount}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {t("table.grade")}: <span className="font-semibold text-[var(--color-ink)]">{gradeD}/8</span>
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`text-xl font-black ${overallGrade >= 5 ? "text-[color-mix(in_srgb,var(--color-green)_82%,white)]" : "text-[color-mix(in_srgb,var(--color-amber)_92%,white)]"}`}>
                          {overallGrade}<span className="text-[10px] font-normal text-[var(--color-muted)]">/7</span>
                        </span>
                      </td>
                      <td className="text-center">
                        {isFailing ? (
                          <span className="badge badge--red">{t("status.atRisk")}</span>
                        ) : (
                          <span className="badge badge--green">{t("status.good")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[var(--color-muted)]">
            {t("dashboard.noStudentsYet")}
          </div>
        )}
      </div>
    </div>
  );
}
