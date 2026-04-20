"use server";

import { requireSession, hashPassword } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAdminAccountAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "owner") {
    return { error: "Permission denied. Only owners can create new administrators." };
  }

  const fullName = formData.get("fullName") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const buildingId = formData.get("buildingId") as string;

  if (!fullName || !email || !password) {
    return { error: "Full name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  try {
    const passwordHash = await hashPassword(password);
    const bid = (buildingId === "" || buildingId === "null") ? null : buildingId;

    await createUser({
      email,
      passwordHash,
      fullName,
      role: "admin",
      buildingId: bid
    });

    revalidatePath("/admins");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create administrator account." };
  }
}
