"use server";

import { revalidatePath } from "next/cache";

import { getSetting, recordAttendanceByStudentCode } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export async function checkInRecognizedFace(studentCode: string) {
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const result = await recordAttendanceByStudentCode({
    studentCode,
    source: "facial_recognition",
    notes: t("camera.recognizedCheckingIn"),
  });

  if (result.status === "created") {
    revalidatePath("/dashboard");
    revalidatePath("/attendance");
    revalidatePath("/statistics");
  }

  // If status is "duplicate" we just quietly let them know, or return the status to UI
  return {
    status: result.status,
    message:
      result.status === "created"
        ? t("checkin.presentSuccess")
        : result.status === "duplicate"
          ? t("checkin.alreadyCheckedIn")
          : result.status === "missing"
            ? t("checkin.studentNotFound")
            : result.status === "rejected"
              ? t("checkin.outsideWindow")
              : t("checkin.checkInFailed"),
    studentName: result.status === "created" ? result.student.fullName : undefined,
    latesCount: result.status === "created" ? result.student.latesCount : undefined
  };
}

export async function logUnknownFaceAction(base64Image: string) {
  try {
    const { recordUnknownFace } = await import("@/lib/db");
    recordUnknownFace(base64Image);
    revalidatePath("/", "layout");
    return true;
  } catch (error) {
    console.error("Failed to log unknown face", error);
    return false;
  }
}

export async function clearUnknownFacesAction() {
  await requireSession();
  try {
    const { clearUnknownFaces } = await import("@/lib/db");
    clearUnknownFaces();
    revalidatePath("/warnings");
    return true;
  } catch {
    return false;
  }
}

export async function logPhoneDetectionAction(base64Image: string) {
  try {
    const { recordPhoneDetection } = await import("@/lib/db");
    recordPhoneDetection(base64Image);
    revalidatePath("/", "layout");
    return true;
  } catch (error) {
    console.error("Failed to log phone detection", error);
    return false;
  }
}

export async function clearPhoneDetectionsAction() {
  await requireSession();
  try {
    const { clearPhoneDetections } = await import("@/lib/db");
    clearPhoneDetections();
    revalidatePath("/device-logs");
    return true;
  } catch {
    return false;
  }
}

export async function syncOfflineCheckInsAction(
  checkIns: { studentCode: string; capturedAt: string }[]
) {
  await requireSession();
  const { recordAttendanceByStudentCode } = await import("@/lib/db");

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const item of checkIns) {
    try {
      const result = await recordAttendanceByStudentCode({
        studentCode: item.studentCode,
        source: "facial_recognition_offline",
        notes: "Synced from offline cache",
        capturedAt: item.capturedAt
      });
      if (result.status === "created") {
        successCount++;
      } else if (result.status === "duplicate") {
        duplicateCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      console.error("Offline sync item failed:", err);
      errorCount++;
    }
  }

  if (successCount > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/attendance");
    revalidatePath("/statistics");
  }

  return { successCount, duplicateCount, errorCount };
}
