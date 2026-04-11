import { requireSession } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSession();

    const database = await ensureDatabaseReady();

    const rs = await database.execute({
      sql: `
      SELECT
        attendance_date AS attendanceDate,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        captured_at AS capturedAt,
        notes
      FROM attendance_events
      ORDER BY attendance_date DESC, captured_at DESC
    `,
      args: {},
    });

    const rows = rs.rows as Record<string, unknown>[];

    if (rows.length === 0) {
      return new NextResponse("No data available", { status: 404 });
    }

    const headers = [
      "Date",
      "Student ID",
      "Student Name",
      "Class",
      "Source",
      "Captured At",
      "Notes",
    ];

    const csvRows = [headers.join(",")];

    for (const row of rows) {
      const csvRow = [
        `"${String(row.attendanceDate ?? "")}"`,
        `"${String(row.studentCodeSnapshot ?? "")}"`,
        `"${String(row.fullNameSnapshot ?? "")}"`,
        `"${String(row.classNameSnapshot ?? "")}"`,
        `"${String(row.source ?? "")}"`,
        `"${String(row.capturedAt ?? "")}"`,
        `"${String(row.notes ?? "")}"`,
      ];
      csvRows.push(csvRow.join(","));
    }

    const csvString = csvRows.join("\n");

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return new NextResponse("Unauthorized or Internal Error", { status: 500 });
  }
}
