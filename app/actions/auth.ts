"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  getResolvedAdminEmail,
  hashPassword,
  validateLogin,
} from "@/lib/auth";
import { createUser, getSetting, getUserByEmail } from "@/lib/db";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

export async function login(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: t("login.missingCredentials"),
    } satisfies ActionState;
  }

  const isValid = await validateLogin(email, password);

  if (!isValid) {
    return {
      status: "error",
      message: t("login.invalidCredentials"),
    } satisfies ActionState;
  }

  await createSession(email);
  redirect("/dashboard");
}

export async function register(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return {
      status: "error",
      message: t("login.missingCredentials"), // Reusing translation for simplicity
    } satisfies ActionState;
  }

  // Check if user already exists in table
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return {
      status: "error",
      message: "An account with this email already exists.",
    } satisfies ActionState;
  }

  // Check if it's the legacy admin email
  if (email === (await getResolvedAdminEmail())) {
    return {
      status: "error",
      message: "This email is reserved for the system administrator.",
    } satisfies ActionState;
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters long.",
    } satisfies ActionState;
  }

  try {
    const passwordHash = await hashPassword(password);
    await createUser({
      email,
      passwordHash,
      fullName,
    });

    await createSession(email);
  } catch (error) {
    console.error("Registration error:", error);
    return {
      status: "error",
      message: "An unexpected error occurred during registration.",
    } satisfies ActionState;
  }

  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
