"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createParentStudentRequest, updateParentRequestStatus, getUserByEmail } from "@/lib/db";

export async function sendParentRequestAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (session.role !== "parent") return;
  const studentId = formData.get("studentId") as string;
  if (!studentId) return;

  try {
    const parent = await getUserByEmail(session.email);
    if (!parent) throw new Error("Parent user not found");

    await createParentStudentRequest(parent.id, studentId);
    revalidatePath("/parent");
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed") || error.message.includes("duplicate")) {
       console.error("Request already sent.");
    }
  }
}

export async function updateParentRequestAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (session.role !== "student") return;
  const requestId = formData.get("requestId") as string;
  const status = formData.get("status") as "approved" | "rejected";
  if (!requestId || !status) return;

  try {
    await updateParentRequestStatus(requestId, status);
    // Student approves it, revalidate student dashboard
    revalidatePath("/student");
  } catch (error: any) {
    console.error(error.message);
  }
}
