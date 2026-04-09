"use server";

import { revalidatePath } from "next/cache";
import { createSession, requireSession, updateAdminCredentials } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";

export async function saveSettingAction(key: string, value: string) {
  await requireSession();
  try {
    const { updateSetting } = await import("@/lib/db");
    updateSetting(key, value);
    revalidatePath("/", "layout"); // Revalidate everything so the new settings apply everywhere
    return { success: true };
  } catch (error) {
    console.error("Failed to save setting:", error);
    return { success: false, error: "Failed to save setting" };
  }
}

export async function saveSettingsBatchAction(
  updates: Array<{ key: string; value: string }>,
) {
  await requireSession();
  try {
    const { updateSetting } = await import("@/lib/db");
    for (const update of updates) {
      updateSetting(update.key, update.value);
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save settings batch:", error);
    return { success: false, error: "Failed to save settings batch" };
  }
}

export async function updateAccountCredentialsAction(formData: FormData) {
  const session = await requireSession();
  const lang = (getSetting("app_language", "en") as AppLanguage) || "en";
  const t = createTranslator(lang);

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!username) {
    return { success: false, error: t("account.usernameRequired") };
  }

  if (!currentPassword) {
    return { success: false, error: t("account.currentPasswordRequired") };
  }

  if (!newPassword && confirmPassword) {
    return {
      success: false,
      error: t("account.newPasswordOrClearConfirm"),
    };
  }

  if (newPassword && newPassword !== confirmPassword) {
    return { success: false, error: t("account.passwordsNoMatch") };
  }

  const result = await updateAdminCredentials({
    currentPassword,
    nextEmail: username,
    nextPassword: newPassword,
  });

  if (!result.success) {
    return { success: false, error: t("account.updateError") };
  }

  await createSession(result.nextEmail ?? session.email);
  revalidatePath("/settings");
  revalidatePath("/login");

  return {
    success: true,
    message: t("account.updateSuccess"),
    username: result.nextEmail ?? session.email,
  };
}
