"use server";

import { requireSession } from "@/lib/auth";
import { insertAssignment, getUserByEmail, getTeacherByUserId, getTeacherClasses } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return { error: "User not found" };

  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return { error: "Not authorized as an instructor." };

  const classId = formData.get("classId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDateParam = formData.get("dueDate") as string;

  if (!classId || !title || !dueDateParam) {
    return { error: "Missing required fields." };
  }

  // Ensure teacher actually owns this class
  const teacherClasses = await getTeacherClasses(teacher.id);
  if (!teacherClasses.some(c => c.id === classId)) {
    return { error: "You are not assigned to this class." };
  }

  try {
    const dueDateOut = new Date(dueDateParam).toISOString();
    await insertAssignment(classId, title, description || "", dueDateOut);
    revalidatePath("/teacher/assignments");
    revalidatePath("/student/assignments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create assignment" };
  }
}
