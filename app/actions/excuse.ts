"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export async function submitExcuseAction(formData: FormData) {
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  try {
    const studentId = formData.get("studentId") as string;
    const excuseDate = formData.get("date") as string;
    const reason = formData.get("reason") as string;

    if (!studentId || !excuseDate || !reason) {
      return { success: false, error: t("excuse.missingFields") };
    }

    const { createExcuse } = await import("@/lib/db");
    createExcuse(studentId, reason, excuseDate);
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit excuse:", error);
    return { success: false, error: t("excuse.submitFailed") };
  }
}

export async function deleteExcuseAction(id: string) {
  await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  try {
    const { deleteExcuse } = await import("@/lib/db");
    deleteExcuse(id);
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete excuse:", error);
    return { success: false, error: t("excuse.failed") };
  }
}
