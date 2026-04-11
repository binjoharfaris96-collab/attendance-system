import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateStudent, getStudentById } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const raw = String(formData.get("faceDescriptors") ?? "").trim();
  const photoUrl = formData.get("photoUrl") ? String(formData.get("photoUrl")) : null;

  if (!studentId || !raw) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const student = await getStudentById(studentId);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  let faceDescriptors: number[][] | null = null;
  try {
    faceDescriptors = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid face data" }, { status: 400 });
  }

  await updateStudent(studentId, {
    studentCode: student.studentCode,
    fullName: student.fullName,
    className: student.className ?? "",
    faceDescriptors,
    photoUrl: photoUrl ?? student.photoUrl,
  });

  return NextResponse.json({ success: true });
}
