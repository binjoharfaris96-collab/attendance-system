"use server";

import { redirect } from "next/navigation";

import { createSession, destroySession, getDemoRedirectForRole } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import { getRandomDemoUserEmail } from "@/lib/demo-seed";

export async function loginAsDemoRole(formData: FormData) {
  if (!isDemoMode()) {
    redirect("/login");
  }

  const normalizedRole = String(formData.get("role") ?? "").toLowerCase();
  const validRoles = ["student", "teacher", "parent", "admin", "owner"];
  if (!validRoles.includes(normalizedRole)) {
    redirect("/login");
  }

  const email = await getRandomDemoUserEmail(normalizedRole);
  if (!email) {
    redirect("/login");
  }

  await createSession(email);
  redirect(getDemoRedirectForRole(normalizedRole));
}

export async function switchDemoRole() {
  if (!isDemoMode()) {
    redirect("/login");
  }

  await destroySession();
  redirect("/login");
}
