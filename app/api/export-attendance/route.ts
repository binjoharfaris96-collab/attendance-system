import { requireSession } from "@/lib/auth";
import { listAttendanceReportExtended } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

function escapeCSV(val: any) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "admin" && session.role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await listAttendanceReportExtended({
      classId,
      startDate,
      endDate,
      limit: 10000 // reasonable limit for CSV
    });

    if (data.length === 0) {
      return new NextResponse("No attendance records found for this criteria.", { status: 404 });
    }

    const headers = ["Date", "Student ID", "Student Name", "Class", "Source", "Captured At", "Notes"];
    const csvRows = [headers.join(",")];

    for (const row of data) {
      csvRows.push([
        escapeCSV(row.attendanceDate),
        escapeCSV(row.studentCodeSnapshot),
        escapeCSV(row.fullNameSnapshot),
        escapeCSV(row.classNameSnapshot),
        escapeCSV(row.source),
        escapeCSV(row.capturedAt),
        escapeCSV(row.notes)
      ].join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = `attendance_${classId || "all"}_${startDate || "start"}_to_${endDate || "end"}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export error:", err);
    return new NextResponse(`Export failed: ${err.message}`, { status: 500 });
  }
}
