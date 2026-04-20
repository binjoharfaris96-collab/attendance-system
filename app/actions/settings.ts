"use server";

import { revalidatePath } from "next/cache";
import { createSession, requireSession, updateAdminCredentials, getSession } from "@/lib/auth";
import { getSetting, getUserByEmail, updateUserRoleAndPhone } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export async function saveSettingAction(key: string, value: string) {
  await requireSession();
  try {
    const { updateSetting } = await import("@/lib/db");
    await updateSetting(key, value);
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
      await updateSetting(update.key, update.value);
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
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

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

  // Update master admin credentials if this is the master account
  const result = await updateAdminCredentials({
    currentPassword,
    nextEmail: username,
    nextPassword: newPassword,
  });

  if (!result.success) {
    return { success: false, error: t("account.updateError") };
  }

  // Also update the phone number in the users table for this specific user
  const user = await getUserByEmail(session.email);
  if (user) {
    await updateUserRoleAndPhone(user.id, user.role, phone || user.phone);
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

export async function updateUserOnboardingAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const role = String(formData.get("role") ?? "student");
  const phone = String(formData.get("phone") ?? "").trim();

  if (role === "parent" && !phone) {
    return { success: false, error: "Phone number is required for parents." };
  }

  try {
    const user = await getUserByEmail(session.email);
    if (!user) return { success: false, error: "User not found" };

    await updateUserRoleAndPhone(user.id, role, phone);
    
    // Refresh session with new role
    await createSession(user.email);
    
    let redirectPath = "/dashboard";
    if (role === "teacher") redirectPath = "/teacher";
    if (role === "student") redirectPath = "/student";
    if (role === "parent") redirectPath = "/parent";

    return { success: true, redirectPath };
  } catch (error) {
    console.error("Onboarding failed:", error);
    return { success: false, error: "Failed to save profile. Please try again." };
  }
}
