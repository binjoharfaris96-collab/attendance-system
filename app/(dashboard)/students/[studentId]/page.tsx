import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentEditForm, StudentDeleteForm } from "@/components/student-edit-form";
import { StudentFaceUpdate } from "@/components/student-face-update";
import { getStudentById, listAttendanceForStudent, listMisbehaviorReportsForStudent, listStudents } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { updateDisciplinaryEventAction } from "@/app/actions/students";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

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

function translateAttendanceSource(source: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    manual_checkin: "source.manualCheckin",
    facial_recognition: "source.facialRecognition",
  };

  const key = map[source];
  return key ? t(key) : source.replaceAll("_", " ");
}

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

type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);

  if (!student) {
    notFound();
  }

  const allStudents = await listStudents();
  const studentListItem = allStudents.find(s => s.id === studentId);
  const presentCount = studentListItem?.attendanceCount ?? 0;

  const attendance = await listAttendanceForStudent(studentId, 20);
  const behaviorReports = await listMisbehaviorReportsForStudent(studentId, 15);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const absDays = calculateAbsentDays(student.createdAt, presentCount);
  const gradeA = Math.max(0, 8 - absDays);
  const gradeB = Math.max(0, 8 - student.latesCount);
  const gradeC = Math.max(0, 8 - student.excusesCount);
  const gradeD = Math.max(0, 8 - student.breakLatesCount);

  const totalGradeSum = gradeA + gradeB + gradeC + gradeD;
  const overallGrade = calculateOverallGrade(totalGradeSum);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/students"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        {t("student.backToRoster")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left Column: Edit form, Delete form, Behavior Reports, Attendance History */}
        <div className="space-y-6">
          <StudentEditForm student={student} lang={lang} />
          <StudentDeleteForm studentId={student.id} lang={lang} />

          {/* Behavior reports - Moved to left column */}
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                {t("student.behaviorReports")}
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                {t("student.incidentHistory")}
              </p>
            </div>

            {behaviorReports.length > 0 ? (
              <div className="space-y-2">
                {behaviorReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-[var(--color-line)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {translateIssueTypeLabel(report.issueType, t)}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {report.className ?? t("student.unassigned")}
                        </p>
                      </div>
                      <span className="text-[11px] text-[var(--color-muted)]">
                        {formatDateTime(report.reportedAt)}
                      </span>
                    </div>
                    {report.notes ? (
                      <p className="mt-2 text-sm text-[var(--color-ink)]">
                        {report.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-line)] py-8 text-center text-sm text-[var(--color-muted)]">
                {t("student.noBehaviorReports")}
              </div>
            )}
          </div>

          {/* Attendance history - Moved to left column */}
          <div className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                {t("student.attendanceHistory")}
              </h2>
              <p className="text-sm text-[var(--color-muted)]">
                {t("student.recentCheckIns")}
              </p>
            </div>

            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {event.attendanceDate}
                      </p>
                      <p className="text-xs capitalize text-[var(--color-muted)]">
                        {translateAttendanceSource(event.source, t)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge--green">{t("status.present")}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {formatDateTime(event.capturedAt).split(",").pop()?.trim()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-line)] py-10 text-center text-sm text-[var(--color-muted)]">
                {t("student.noCheckIns")}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Face Recognition, Grades & Disciplinary */}
        <div className="space-y-6">
          {/* Face Recognition */}
          <StudentFaceUpdate
            studentId={studentId}
            hasFace={!!student.faceDescriptors}
            lang={lang}
          />

          {/* Disciplinary & Grades */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  {t("student.gradesDisciplinary")}
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  {t("student.startingPoints")}
                </p>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold tracking-wider">{t("student.overallGrade")}</span>
                <span className={`text-4xl font-black ${overallGrade >= 5 ? "text-[color-mix(in_srgb,var(--color-green)_84%,white)]" : "text-[color-mix(in_srgb,var(--color-amber)_92%,white)]"}`}>
                  {overallGrade}<span className="text-sm font-semibold text-[var(--color-muted)]">/7</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--color-line)] p-4 text-center bg-[var(--color-canvas)]">
                <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold tracking-wider">{t("student.absencesA")}</span>
                <p className={`mt-1 text-2xl font-black ${gradeA < 5 ? "text-[color-mix(in_srgb,var(--color-red)_86%,white)]" : "text-[color-mix(in_srgb,var(--color-green)_84%,white)]"}`}>{gradeA}<span className="text-xs font-semibold text-[var(--color-muted)]">/8</span></p>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] p-4 text-center bg-[var(--color-canvas)]">
                <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold tracking-wider">{t("student.latesB")}</span>
                <p className={`mt-1 text-2xl font-black ${gradeB < 5 ? "text-[color-mix(in_srgb,var(--color-red)_86%,white)]" : "text-[color-mix(in_srgb,var(--color-green)_84%,white)]"}`}>{gradeB}<span className="text-xs font-semibold text-[var(--color-muted)]">/8</span></p>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] p-4 text-center bg-[var(--color-canvas)]">
                <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold tracking-wider">{t("student.excusesC")}</span>
                <p className={`mt-1 text-2xl font-black ${gradeC < 5 ? "text-[color-mix(in_srgb,var(--color-red)_86%,white)]" : "text-[color-mix(in_srgb,var(--color-green)_84%,white)]"}`}>{gradeC}<span className="text-xs font-semibold text-[var(--color-muted)]">/8</span></p>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] p-4 text-center bg-[var(--color-canvas)]">
                <span className="text-[10px] uppercase text-[var(--color-muted)] font-bold tracking-wider">{t("student.breakLatesD")}</span>
                <p className={`mt-1 text-2xl font-black ${gradeD < 5 ? "text-[color-mix(in_srgb,var(--color-red)_86%,white)]" : "text-[color-mix(in_srgb,var(--color-green)_84%,white)]"}`}>{gradeD}<span className="text-xs font-semibold text-[var(--color-muted)]">/8</span></p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--color-line)]">
              <div className="flex items-center gap-2">
                <form action={updateDisciplinaryEventAction} className="flex-1">
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="late" />
                  <input type="hidden" name="amount" value="1" />
                  <button type="submit" className="btn btn--outline flex w-full justify-between text-left hover:bg-[var(--color-red-light)]">
                    <span className="font-semibold">{t("student.markLate")}</span>
                    <span className="badge badge--red">-1 {t("student.point")} (B)</span>
                  </button>
                </form>
                <form action={updateDisciplinaryEventAction}>
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="late" />
                  <input type="hidden" name="amount" value="-1" />
                  <button type="submit" className="btn btn--outline h-full px-3 text-[color-mix(in_srgb,var(--color-green)_82%,white)] hover:bg-[var(--color-green-light)]" title={t("student.undoTooltip")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2">
                <form action={updateDisciplinaryEventAction} className="flex-1">
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="excused" />
                  <input type="hidden" name="amount" value="1" />
                  <button type="submit" className="btn btn--outline flex w-full justify-between text-left hover:bg-[var(--color-red-light)]">
                    <span className="font-semibold">{t("student.markExcused")}</span>
                    <span className="badge badge--red">-1 {t("student.point")} (C)</span>
                  </button>
                </form>
                <form action={updateDisciplinaryEventAction}>
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="excused" />
                  <input type="hidden" name="amount" value="-1" />
                  <button type="submit" className="btn btn--outline h-full px-3 text-[color-mix(in_srgb,var(--color-green)_82%,white)] hover:bg-[var(--color-green-light)]" title={t("student.undoTooltip")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2">
                <form action={updateDisciplinaryEventAction} className="flex-1">
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="break_late" />
                  <input type="hidden" name="amount" value="1" />
                  <button type="submit" className="btn btn--outline flex w-full justify-between text-left hover:bg-[var(--color-red-light)]">
                    <span className="font-semibold">{t("student.markTimeout")}</span>
                    <span className="badge badge--red">-1 {t("student.point")} (D)</span>
                  </button>
                </form>
                <form action={updateDisciplinaryEventAction}>
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="eventType" value="break_late" />
                  <input type="hidden" name="amount" value="-1" />
                  <button type="submit" className="btn btn--outline h-full px-3 text-[color-mix(in_srgb,var(--color-green)_82%,white)] hover:bg-[var(--color-green-light)]" title={t("student.undoTooltip")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
