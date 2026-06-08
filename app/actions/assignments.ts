"use server";

import { requireSession } from "@/lib/auth";
import { getAssignmentById, getUserByEmail, getTeacherByUserId, getTeacherClasses } from "@/lib/db";
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

  if (!classId || !title) {
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
    const dueDateOut = dueDateParam ? new Date(dueDateParam).toISOString() : "";
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
      content: `A new task has been posted for ${targetClass.name}. \nDue Date: ${dueDateOut ? new Date(dueDateOut).toLocaleDateString() : "No due date"} \nPoints: ${points}`,
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

export async function submitAssignmentAction(formData: FormData) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return { error: "User not found" };

  const { getStudentByUserId, insertSubmission } = await import("@/lib/db");
  const student = await getStudentByUserId(user.id);
  if (!student) return { error: "Not authorized as a student." };

  const assignmentId = formData.get("assignmentId") as string;
  const fileUrl = formData.get("fileUrl") as string;
  const attachmentName = formData.get("attachmentName") as string;
  const content = formData.get("content") as string;

  if (!assignmentId) {
    return { error: "Missing assignment ID." };
  }

  try {
    await insertSubmission(assignmentId, student.id, fileUrl || null, attachmentName || null, content || null, student.buildingId);
    
    revalidatePath("/student/assignments");
    revalidatePath(`/student/assignments/${assignmentId}`);
    revalidatePath(`/teacher/assignments/${assignmentId}`);
    revalidatePath("/teacher/assignments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to submit assignment" };
  }
}

export async function gradeSubmissionAction(formData: FormData) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return { error: "User not found" };

  const { getTeacherByUserId, gradeSubmission } = await import("@/lib/db");
  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return { error: "Not authorized as an instructor." };

  const submissionId = formData.get("submissionId") as string;
  const assignmentId = formData.get("assignmentId") as string;
  const score = Number(formData.get("score"));
  const feedback = formData.get("feedback") as string;

  if (!submissionId || !assignmentId || isNaN(score)) {
    return { error: "Missing required fields or invalid score." };
  }

  try {
    await gradeSubmission(submissionId, score, feedback || null, teacher.buildingId);
    
    revalidatePath("/student/assignments");
    revalidatePath(`/student/assignments/${assignmentId}`);
    revalidatePath(`/teacher/assignments/${assignmentId}`);
    revalidatePath("/teacher/assignments");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to grade submission" };
  }
}

async function requireTeacherForAssignment(assignmentId: string) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  if (!user) return { error: "User not found" as const };

  const teacher = await getTeacherByUserId(user.id);
  if (!teacher) return { error: "Not authorized as an instructor." as const };

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return { error: "Assignment not found." as const };

  const teacherClasses = await getTeacherClasses(teacher.id);
  const ownsClass = teacherClasses.some((c) => c.id === assignment.classId);
  if (!ownsClass) return { error: "You are not assigned to this assignment." as const };

  return { user, teacher, assignment };
}

function getSubmissionIds(formData: FormData) {
  return formData
    .getAll("submissionId")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function toggleAcceptingSubmissionsAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const accepting = String(formData.get("accepting") ?? "") === "true";
  if (!assignmentId) return;

  const auth = await requireTeacherForAssignment(assignmentId);
  if ("error" in auth) return;

  const { setAssignmentAcceptingSubmissions } = await import("@/lib/db");
  await setAssignmentAcceptingSubmissions(assignmentId, accepting);
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
}

export async function markReviewedAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  const auth = await requireTeacherForAssignment(assignmentId);
  if ("error" in auth) return;

  const { markAssignmentSubmissionsReviewed } = await import("@/lib/db");
  await markAssignmentSubmissionsReviewed(assignmentId, getSubmissionIds(formData));
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
}

export async function returnWorkAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  const auth = await requireTeacherForAssignment(assignmentId);
  if ("error" in auth) return;

  const { returnAssignmentSubmissions } = await import("@/lib/db");
  await returnAssignmentSubmissions(assignmentId, getSubmissionIds(formData));
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
}

export async function addAssignmentCommentAction(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!assignmentId || !content) return;

  const auth = await requireTeacherForAssignment(assignmentId);
  if ("error" in auth) return;

  const { insertAssignmentComment } = await import("@/lib/db");
  await insertAssignmentComment({
    assignmentId,
    authorId: auth.user.id,
    content,
    buildingId: auth.teacher.buildingId,
  });
  revalidatePath(`/teacher/assignments/${assignmentId}`);
}
