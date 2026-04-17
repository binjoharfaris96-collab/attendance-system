"use server";

import { hash } from "bcrypt";
import { registerStudentUser } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function registerStudentAction(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const parentName = formData.get("parentName") as string;
  const parentPhone = formData.get("parentPhone") as string;
  const studentCode = formData.get("studentCode") as string;

  if (!fullName || !email || !password || !dateOfBirth || !parentName || !parentPhone || !studentCode) {
    return { error: "All fields are required" };
  }

  try {
    const passwordHash = await hash(password, 10);
    
    await registerStudentUser({
      fullName,
      email,
      passwordHash,
      dateOfBirth,
      parentName,
      parentPhone,
      studentCode
    });

    revalidatePath("/dashboard/students");
    return { success: true };
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint failed: users.email")) {
      return { error: "This email is already registered." };
    }
    if (err.message?.includes("UNIQUE constraint failed: students.student_code")) {
      return { error: "This Student ID is already registered." };
    }
    return { error: err.message || "Registration failed." };
  }
}
