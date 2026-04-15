import { NextResponse } from "next/server";

import { createSession, getResolvedAdminEmail, hashPassword } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";

const ALLOWED_STUDENT_DOMAIN = "stu.kfs.sch.sa";
const ALLOWED_TEACHER_DOMAIN = "kfs.sch.sa";

function isAllowedEmail(email: string) {
  const domain = email.split("@")[1];
  return domain === ALLOWED_STUDENT_DOMAIN || domain === ALLOWED_TEACHER_DOMAIN;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Only @${ALLOWED_STUDENT_DOMAIN} and @${ALLOWED_TEACHER_DOMAIN} emails are allowed.` },
        { status: 403 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (email === (await getResolvedAdminEmail())) {
      return NextResponse.json(
        { success: false, error: "This email is reserved for administrator login." },
        { status: 400 },
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const role = email.endsWith(`@${ALLOWED_STUDENT_DOMAIN}`) ? "student" : "teacher";

    const passwordHash = await hashPassword(password);
    await createUser({
      fullName: name,
      email,
      passwordHash,
      role,
    });

    await createSession(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup API failed:", error);
    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
