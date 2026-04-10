import { requireSession } from "@/lib/auth";
import { listAttendanceReport } from "@/lib/db";

export const runtime = "nodejs";

function escapeCsvCell(value: string | null) {
  if (value === null) {
    return "";
  }

  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

export async function GET(request: Request) {
  await requireSession();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const events = await listAttendanceReport(5000, date);

  const lines = [
    [
      "student_id",
      "student_name",
      "class_name",
      "source",
      "attendance_date",
      "captured_at",
      "notes",
    ].join(","),
    ...events.map((event) =>
      [
        escapeCsvCell(event.studentCodeSnapshot),
        escapeCsvCell(event.fullNameSnapshot),
        escapeCsvCell(event.classNameSnapshot),
        escapeCsvCell(event.source),
        escapeCsvCell(event.attendanceDate),
        escapeCsvCell(event.capturedAt),
        escapeCsvCell(event.notes),
      ].join(","),
    ),
  ];

  const fileName = date
    ? `attendance-${date}.csv`
    : "attendance-report.csv";

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
