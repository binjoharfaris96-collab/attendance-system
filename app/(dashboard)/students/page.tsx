import Link from "next/link";

import { StudentAddModal } from "@/components/student-add-modal";
import { listStudents } from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function StudentsPage() {
  const students = listStudents();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("students.title")}</h1>
          <p className="page-subtitle">{t("students.subtitle")}</p>
        </div>
        <StudentAddModal />
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={t("students.search")}
        className="search-input"
        id="student-search"
      />

      {/* Student cards grid */}
      {students.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              className="card flex flex-col items-center gap-3 py-6 text-center"
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="h-16 w-16 rounded-full border-2 border-[var(--color-line)] object-cover"
                />
              ) : (
                <span className="avatar avatar--lg">
                  {student.fullName.charAt(0)}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {student.fullName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {student.studentCode}
                </p>
              </div>
              {student.faceDescriptors ? (
                <span className="badge badge--teal">{t("students.faceRegistered")}</span>
              ) : (
                <span className="badge badge--amber">{t("students.noFaceData")}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center text-sm text-[var(--color-muted)]">
          {t("students.noStudentsYet")}
        </div>
      )}
    </div>
  );
}
