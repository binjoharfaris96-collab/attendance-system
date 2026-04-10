"use server";

import { revalidatePath } from "next/cache";

import { createStudent, getSetting, getStudentById, updateStudent } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

function parseStudentFields(formData: FormData) {
  const result: {
    studentCode: string;
    fullName: string;
    className: string;
    faceDescriptors?: number[][] | null;
    photoUrl?: string | null;
  } = {
    studentCode: String(formData.get("studentCode") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    className: String(formData.get("className") ?? "").trim(),
  };

  if (formData.has("faceDescriptors")) {
    const rawDescriptors = formData.get("faceDescriptors");
    if (typeof rawDescriptors === "string" && rawDescriptors.trim()) {
      try {
        result.faceDescriptors = JSON.parse(rawDescriptors);
      } catch {
        result.faceDescriptors = null;
      }
    } else {
      result.faceDescriptors = null;
    }
  }

  if (formData.has("photoUrl")) {
    const rawPhotoUrl = formData.get("photoUrl");
    result.photoUrl = typeof rawPhotoUrl === "string" && rawPhotoUrl.trim() ? rawPhotoUrl : null;
  }

  return result;
}

function validateStudentFields(input: {
  studentCode: string;
  fullName: string;
}, t: (key: string) => string) {
  if (!input.studentCode) {
    return t("student.studentIdRequired");
  }

  if (!input.fullName) {
    return t("student.studentNameRequired");
  }

  return null;
}

function getDatabaseErrorMessage(error: unknown, t: (key: string) => string) {
  if (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed: students.student_code")
  ) {
    return t("student.studentIdExists");
  }

  return t("student.studentSaveFailed");
}

export async function createStudentAction(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const input = parseStudentFields(formData);
  const validationMessage = validateStudentFields(input, t);

  if (validationMessage) {
    return {
      status: "error",
      message: validationMessage,
    } satisfies ActionState;
  }

  try {
    await createStudent(input);
  } catch (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(error, t),
    } satisfies ActionState;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/attendance");
  revalidatePath("/reports");

  return {
    status: "success",
    message: t("student.studentAdded"),
  } satisfies ActionState;
}

export async function updateStudentAction(
  studentId: string,
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const existingStudent = await getStudentById(studentId);
  if (!existingStudent) {
    return {
      status: "error",
      message: t("student.studentNotFound"),
    } satisfies ActionState;
  }

  const input = parseStudentFields(formData);
  const validationMessage = validateStudentFields(input, t);

  if (validationMessage) {
    return {
      status: "error",
      message: validationMessage,
    } satisfies ActionState;
  }

  try {
    await updateStudent(studentId, input);
  } catch (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(error, t),
    } satisfies ActionState;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/attendance");
  revalidatePath("/reports");

  return {
    status: "success",
    message: t("student.studentUpdated"),
  } satisfies ActionState;
}

export async function deleteStudentAction(studentId: string) {
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  try {
    const { deleteStudent } = await import("@/lib/db");
    await deleteStudent(studentId);
  } catch {
    return {
      status: "error",
      message: t("student.studentDeleteFailed"),
    } satisfies ActionState;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/attendance");
  revalidatePath("/reports");

  return {
    status: "success",
    message: t("student.studentDeleted"),
  } satisfies ActionState;
}

export async function updateDisciplinaryEventAction(formData: FormData) {
  await requireSession();

  const studentId = formData.get("studentId") as string;
  const eventType = formData.get("eventType") as "late" | "excused" | "break_late";
  const amount = Number(formData.get("amount"));

  try {
    const { updateStudentDisciplinaryCount } = await import("@/lib/db");
    await updateStudentDisciplinaryCount(studentId, eventType, amount);
  } catch (error) {
    console.error("Could not log disciplinary event:", error);
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
