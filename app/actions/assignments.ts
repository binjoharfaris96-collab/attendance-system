"use server";

import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses } from "@/lib/db";
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
  const topic = formData.get("topic") as string;
  const assignmentType = formData.get("assignmentType") as string;
  const points = formData.get("points") ? Number(formData.get("points")) : 100;
  const attachmentUrl = formData.get("attachmentUrl") as string;
  const attachmentName = formData.get("attachmentName") as string;
  const scheduledAtParam = formData.get("scheduledAt") as string;

  if (!classId || !title || !dueDateParam) {
    return { error: "Missing required fields." };
  }

  // Ensure teacher actually owns this class
  const teacherClasses = await getTeacherClasses(teacher.id);
  const targetClass = teacherClasses.find(c => c.id === classId);
  if (!targetClass) {
    return { error: "You are not assigned to this class." };
  }

  try {
    const { insertAssignment, insertAnnouncement } = await import("@/lib/db");
    const dueDateOut = new Date(dueDateParam).toISOString();
    const scheduledAt = scheduledAtParam ? new Date(scheduledAtParam).toISOString() : null;
    
    // 1. Create the assignment
    await insertAssignment(
      classId, title, description || "", dueDateOut, 
      topic, assignmentType, points, 
      attachmentUrl, attachmentName, scheduledAt
    );

    // 2. Automatically post to Stream
    await insertAnnouncement({
      title: `New ${assignmentType || "Assignment"}: ${title}`,
      content: `A new task has been posted for ${targetClass.name}. \nDue Date: ${new Date(dueDateOut).toLocaleDateString()} \nPoints: ${points}`,
      targetRole: "student",
      buildingId: teacher.buildingId,
      attachmentType: "assignment_link",
      attachmentUrl: attachmentUrl,
      attachmentName: attachmentName,
      scheduledAt: scheduledAt,
      authorId: user.id
    });

    revalidatePath("/teacher/assignments");
    revalidatePath("/student/assignments");
    revalidatePath("/announcements");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create assignment" };
  }
}
