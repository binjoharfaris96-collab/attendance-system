"use server";

import { revalidatePath } from "next/cache";

import { } from "@/lib/auth";
import { createMisbehaviorReport, getSetting } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

const ISSUE_TYPES = new Set([
  "Class disruption",
  "Disrespectful behavior",
  "Bullying",
  "Fighting",
  "Phone misuse",
  "Cheating",
  "Skipping class",
  "Property damage",
  "Other",
]);

export async function submitMisbehaviorAction(formData: FormData) {
  const session = await ();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const studentId = String(formData.get("studentId") ?? "").trim();
  const className = String(formData.get("className") ?? "").trim();
  const issueType = String(formData.get("issueType") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId) {
    return { success: false, error: t("behavior.selectStudentRequired") };
  }

  if (!className) {
    return { success: false, error: t("behavior.selectClassRequired") };
  }

  if (!issueType) {
    return { success: false, error: t("behavior.selectIssueRequired") };
  }

  if (!ISSUE_TYPES.has(issueType)) {
    return { success: false, error: t("behavior.invalidIssueType") };
  }

  try {
    await createMisbehaviorReport({
      studentId,
      className,
      issueType,
      notes: notes || null,
      reportedBy: session.email,
    });
  } catch (error) {
    console.error("Failed to create misbehavior report:", error);
    return { success: false, error: t("behavior.submitFailed") };
  }

  revalidatePath("/behavior");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: t("behavior.reportSubmitted"),
  };
}
