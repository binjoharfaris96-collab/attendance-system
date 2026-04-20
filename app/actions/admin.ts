"use server";

import { requireSession } from "@/lib/auth";
import { 
  updateStudentUserId, 
  updateTeacherUserId, 
  createAnnouncement, 
  deleteAnnouncement,
  createTeacher,
  deleteTeacher,
  createClass,
  deleteClass,
  enrollStudentInClass,
  unenrollStudentFromClass,
  updateClassTeacher,
  createSchedule,
  deleteSchedule,
  saveWeeklySchedulesForClass
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function linkUserToStudentAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const studentId = formData.get("studentId") as string;
  const userId = formData.get("userId") as string;

  try {
    await updateStudentUserId(studentId, userId || null);
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to link user" };
  }
}

export async function linkUserToTeacherAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const teacherId = formData.get("teacherId") as string;
  const userId = formData.get("userId") as string;

  try {
    await updateTeacherUserId(teacherId, userId || null);
    revalidatePath(`/teachers/${teacherId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to link user" };
  }
}

export async function createAnnouncementAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const targetRole = formData.get("targetRole") as string;

  if (!title || !content) return { error: "Missing fields" };

  try {
    await createAnnouncement(title, content, targetRole || "all", session.buildingId);
    revalidatePath("/student");
    revalidatePath("/teacher");
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to post announcement" };
  }
}

export async function deleteAnnouncementAction(id: string) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  try {
    await deleteAnnouncement(id);
    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete announcement" };
  }
}

export async function createTeacherAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const fullName = formData.get("fullName") as string;
  const department = formData.get("department") as string;

  if (!fullName) return { error: "Name is required" };

  try {
    await createTeacher({ fullName, department, buildingId: session.buildingId });
    revalidatePath("/dashboard/teachers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create teacher" };
  }
}

export async function deleteTeacherAction(id: string) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  try {
    await deleteTeacher(id);
    revalidatePath("/dashboard/teachers");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete teacher" };
  }
}

export async function createClassAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const name = formData.get("name") as string;
  const teacherId = formData.get("teacherId") as string;
  const subject = formData.get("subject") as string;

  if (!name || !teacherId) return { error: "Name and Teacher are required" };

  try {
    await createClass({ name, teacherId, subject, buildingId: session.buildingId });
    revalidatePath("/classes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create class" };
  }
}

export async function deleteClassAction(id: string) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  try {
    await deleteClass(id);
    revalidatePath("/classes");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete class" };
  }
}

export async function enrollStudentAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const classId = formData.get("classId") as string;
  const studentId = formData.get("studentId") as string;

  if (!classId || !studentId) return { error: "Missing fields" };

  try {
    await enrollStudentInClass(studentId, classId);
    revalidatePath(`/classes/${classId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to enroll student" };
  }
}

export async function unenrollStudentAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const classId = formData.get("classId") as string;
  const studentId = formData.get("studentId") as string;

  try {
    await unenrollStudentFromClass(studentId, classId);
    revalidatePath(`/classes/${classId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to unenroll student" };
  }
}

export async function updateClassTeacherAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const classId = formData.get("classId") as string;
  const teacherId = formData.get("teacherId") as string;

  try {
    await updateClassTeacher(classId, teacherId);
    revalidatePath(`/classes/${classId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update teacher" };
  }
}

export async function createScheduleAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  const classId = formData.get("classId") as string;
  const teacherId = formData.get("teacherId") as string;
  const subject = formData.get("subject") as string;
  const dayOfWeek = formData.get("dayOfWeek") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!classId || !teacherId || !subject || !dayOfWeek || !startTime || !endTime) {
    return { error: "All fields are required" };
  }

  try {
    await createSchedule({ classId, teacherId, subject, dayOfWeek, startTime, endTime });
    revalidatePath("/dashboard/schedules");
    revalidatePath("/teacher"); // Teacher might need updated schedule
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create schedule" };
  }
}

export async function saveWeeklyScheduleAction(payload: { classId: string, schedules: Array<{ teacherId: string; subject: string; dayOfWeek: string; startTime: string; endTime: string }> }) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  if (!payload.classId || !payload.schedules) {
    return { error: "Class ID and Schedule Data are required" };
  }

  try {
    await saveWeeklySchedulesForClass(payload.classId, payload.schedules, session.buildingId);
    revalidatePath("/dashboard/schedules");
    revalidatePath("/teacher"); 
    revalidatePath("/student");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save the weekly schedule grid." };
  }
}

export async function deleteScheduleAction(id: string) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "owner") return { error: "Access denied" };

  try {
    await deleteSchedule(id);
    revalidatePath("/dashboard/schedules");
    revalidatePath("/teacher");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete schedule" };
  }
}
