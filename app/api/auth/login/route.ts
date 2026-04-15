import { NextResponse } from "next/server";

import { createSession, validateLogin } from "@/lib/auth";

const ALLOWED_STUDENT_DOMAIN = "stu.kfs.sch.sa";
const ALLOWED_TEACHER_DOMAIN = "kfs.sch.sa";

function isAllowedEmail(email: string) {
  const domain = email.split("@")[1];
  return domain === ALLOWED_STUDENT_DOMAIN || domain === ALLOWED_TEACHER_DOMAIN;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: `Access denied. Only @${ALLOWED_STUDENT_DOMAIN} and @${ALLOWED_TEACHER_DOMAIN} emails are allowed.` },
        { status: 403 },
      );
    }

    const isValid = await validateLogin(email, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await createSession(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API failed:", error);
    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
