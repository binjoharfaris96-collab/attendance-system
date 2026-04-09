"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { formatDateTime } from "@/lib/time";
import { t, type AppLanguage } from "@/lib/i18n";

type AttendanceRow = {
  id: string;
  studentId: string;
  studentCodeSnapshot: string;
  fullNameSnapshot: string;
  classNameSnapshot: string | null;
  source: string;
  notes: string | null;
  attendanceDate: string;
  capturedAt: string;
};

type StudentPhotoMap = Record<string, string | null>;

export function AttendanceLogTable({
  attendance,
  today,
  studentPhotoById,
  lang = "en",
}: {
  attendance: AttendanceRow[];
  today: string;
  studentPhotoById: StudentPhotoMap;
  lang?: AppLanguage;
}) {
  const [query, setQuery] = useState("");

  const filteredAttendance = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attendance;

    return attendance.filter((event) => {
      const haystack = [
        event.fullNameSnapshot,
        event.studentCodeSnapshot,
        event.classNameSnapshot ?? "",
        event.attendanceDate,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [attendance, query]);

  const todayRecords = filteredAttendance.filter(
    (event) => event.attendanceDate === today,
  );

  return (
    <>
      <div className="border-b border-[var(--color-line)] px-1 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-semibold text-[var(--color-ink)]">
              {t("log.recordsFor", lang)} {today}
            </p>
            <p className="text-sm text-[color-mix(in_srgb,var(--color-green)_84%,white)]">
              {todayRecords.length} {t("log.recordsFound", lang)}
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("log.searchPlaceholder", lang)}
            className="search-input max-w-[18rem]"
          />
        </div>
      </div>

      {filteredAttendance.length > 0 ? (
        <table className="data-table mt-2">
          <thead>
            <tr>
              <th>{t("log.student", lang)}</th>
              <th>{t("log.id", lang)}</th>
              <th>{t("log.date", lang)}</th>
              <th>{t("log.time", lang)}</th>
              <th>{t("log.status", lang)}</th>
              <th>{t("log.actions", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((event) => {
              const formatted = formatDateTime(event.capturedAt);
              const timePart = formatted.split(",").pop()?.trim() ?? formatted;
              const datePart =
                formatted.split(",").slice(0, -1).join(",").trim() ||
                event.attendanceDate;
              const photoUrl = studentPhotoById[event.studentId];

              return (
                <tr key={event.id} className="student-hover-row">
                  <td>
                    <div className="student-hover-target flex items-center gap-3">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
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
                      <span className="student-hover-name font-medium text-[var(--color-ink)]">
                        {event.fullNameSnapshot}
                      </span>
                    </div>
                  </td>
                  <td className="text-[var(--color-muted)]">
                    {event.studentCodeSnapshot}
                  </td>
                  <td className="text-[var(--color-muted)]">{datePart}</td>
                  <td>
                    <span className="flex items-center gap-1 text-[var(--color-muted)]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {timePart}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--green">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t("log.present", lang)}
                    </span>
                  </td>
                  <td>
                    <span className="text-[var(--color-muted)] opacity-40">
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
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="py-12 text-center text-sm text-[var(--color-muted)]">
          {query.trim()
            ? t("log.noSearchResults", lang)
            : t("log.noRecords", lang)}
        </div>
      )}
    </>
  );
}
