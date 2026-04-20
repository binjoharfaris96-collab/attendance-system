import { AttendanceLogTable } from "@/components/attendance-log-table";
import { listRecentAttendance, listStudents } from "@/lib/db";
import { toAttendanceDate } from "@/lib/time";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { requireSession } from "@/lib/auth";

export default async function AttendancePage() {
  const session = await requireSession();
  const attendance = await listRecentAttendance(50, session.buildingId);
  const students = await listStudents(session.buildingId);
  const today = toAttendanceDate(new Date().toISOString());
  const studentPhotoById = Object.fromEntries(
    students.map((student) => [student.id, student.photoUrl]),
  );
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("attendance.title")}</h1>
          <p className="page-subtitle">
            {t("attendance.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="btn btn--outline text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {today}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </span>
        </div>
      </div>

      {/* Date sub-header */}
      <div className="card">
        <AttendanceLogTable
          attendance={attendance}
          today={today}
          studentPhotoById={studentPhotoById}
          lang={lang}
        />
      </div>
    </div>
  );
}
