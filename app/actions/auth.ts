"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  validateLogin,
} from "@/lib/auth";
import { getSetting } from "@/lib/db";
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

export async function logout() {
  await destroySession();
  redirect("/login");
}
