"use server";

import { requireSession } from "@/lib/auth";
import { ensureDatabaseReady, getUserByEmail } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserPhotoAction(formData: FormData) {
  const session = await requireSession();
  const photoUrl = formData.get("photoUrl") as string;
  
  if (!photoUrl) return { error: "Photo URL is required" };

  try {
    const db = await ensureDatabaseReady();
    const user = await getUserByEmail(session.email);
    if (!user) return { error: "User not found" };

    await db.execute({
      sql: "UPDATE users SET photo_url = ? WHERE id = ?",
      args: [photoUrl, user.id]
    });

    revalidatePath("/student");
    revalidatePath("/teacher");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update profile picture" };
  }
}
