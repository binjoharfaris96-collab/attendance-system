"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { recordAttendanceByStudentCode, markManualAttendance } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

export async function checkInStudentAction(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const studentCode = String(formData.get("studentCode") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentCode) {
    return {
      status: "error",
      message: t("checkin.studentIdRequired"),
    } satisfies ActionState;
  }

  const result = await recordAttendanceByStudentCode({
    studentCode,
    notes,
  });

  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/statistics");

  if (result.status === "created") {
    revalidatePath(`/students/${result.student.id}`);

    return {
      status: "success",
      message: `${result.student.fullName}: ${t("checkin.presentSuccess")}`,
    } satisfies ActionState;
  }

  if (result.status === "duplicate") {
    return {
      status: "error",
      message: t("checkin.alreadyCheckedIn"),
    } satisfies ActionState;
  }

  if (result.status === "missing") {
    return {
      status: "error",
      message: t("checkin.studentNotFound"),
    } satisfies ActionState;
  }

  if (result.status === "rejected") {
    return {
      status: "error",
      message: t("checkin.outsideWindow"),
    } satisfies ActionState;
  }

  return {
    status: "error",
    message: t("checkin.checkInFailed"),
  } satisfies ActionState;
}

export async function markManualAttendanceAction(formData: FormData) {
  const session = await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const studentId = formData.get("studentId") as string;
  const scheduleId = formData.get("scheduleId") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  if (!studentId || !scheduleId || !date || !status) {
    return { error: "Missing required fields" };
  }

  try {
    await markManualAttendance({
      studentId,
      scheduleId,
      date,
      status,
      notes: notes || undefined
    });

    revalidatePath(`/teacher/attendance/${scheduleId}`);
    revalidatePath("/dashboard");
    revalidatePath("/attendance");
    revalidatePath("/statistics");
    revalidatePath(`/students/${studentId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark attendance" };
  }
}
