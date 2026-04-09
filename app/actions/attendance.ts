"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { getSetting, recordAttendanceByStudentCode } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

export async function checkInStudentAction(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();
  const lang = (getSetting("app_language", "en") as AppLanguage) || "en";
  const t = createTranslator(lang);

  const studentCode = String(formData.get("studentCode") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentCode) {
    return {
      status: "error",
      message: t("checkin.studentIdRequired"),
    } satisfies ActionState;
  }

  const result = recordAttendanceByStudentCode({
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
