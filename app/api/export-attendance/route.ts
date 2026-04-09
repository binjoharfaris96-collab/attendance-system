import { requireSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSession();
    
    // In a real app we'd fetch this statically or connect properly, here we fetch directly 
    const database = getDatabase();
    
    // Export all attendance events
    const rows = database.prepare(`
      SELECT 
        attendance_date,
        student_code_snapshot,
        full_name_snapshot,
        class_name_snapshot,
        source,
        captured_at,
        notes
      FROM attendance_events
      ORDER BY attendance_date DESC, captured_at DESC
    `).all() as any[];

    // Convert rows to CSV string
    if (rows.length === 0) {
      return new NextResponse("No data available", { status: 404 });
    }

    const headers = ["Date", "Student ID", "Student Name", "Class", "Source", "Captured At", "Notes"];
    
    const csvRows = [headers.join(",")];
    
    for (const row of rows) {
      const csvRow = [
        `"${row.attendance_date}"`,
        `"${row.student_code_snapshot}"`,
        `"${row.full_name_snapshot}"`,
        `"${row.class_name_snapshot || ''}"`,
        `"${row.source}"`,
        `"${row.captured_at}"`,
        `"${row.notes || ''}"`
      ];
      csvRows.push(csvRow.join(","));
    }
    
    const csvString = csvRows.join("\n");
    
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return new NextResponse("Unauthorized or Internal Error", { status: 500 });
  }
}
