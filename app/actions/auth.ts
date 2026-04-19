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

  // Step 1: Check if user exists in the database
  const user = await getUserByEmail(email);

  // Step 3: Validate password (against DB or fallback admin)
  const isValid = await validateLogin(email, password);

  if (!isValid) {
    return {
      status: "error",
      message: t("login.invalidCredentials"),
    } satisfies ActionState;
  }

  const selectedRole = String(formData.get("role") ?? "").toLowerCase();
  const resolvedAdminEmail = await getResolvedAdminEmail();
  const isAdminEmail = email === resolvedAdminEmail;
  
  // Step 4: Verify role if provided — skip for admin email accounts
  if (selectedRole && user && user.role !== selectedRole && !isAdminEmail) {
    return {
      status: "error",
      message: t("login.invalidRole"),
    } satisfies ActionState;
  }

  // Admin email always gets admin role; DB users use their stored role
  const role = isAdminEmail ? "admin" : (user?.role || "admin");

  await createSession(email);
  console.log("LOGIN SUCCESS:", email, "assigned role:", role);

  // Step 5: Redirect based on role
  if (role === "teacher") {
    redirect("/teacher");
  } else if (role === "student") {
    redirect("/student");
  } else {
    redirect("/dashboard");
  }
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
  const selectedRole = String(formData.get("role") ?? "student").toLowerCase();

  if (!fullName || !email || !password) {
    return {
      status: "error",
      message: t("login.missingCredentials"),
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
    const role = selectedRole === "teacher" ? "teacher" : "student";

    const passwordHash = await hashPassword(password);
    await createUser({
      email,
      passwordHash,
      fullName,
      role,
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
