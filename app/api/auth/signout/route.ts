import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

/**
 * GET /api/auth/signout — browser-navigable sign-out endpoint.
 * Destroys the session cookie and redirects to the login page.
 */
export async function GET(request: Request) {
  await destroySession();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

/**
 * POST /api/auth/signout — API sign-out endpoint (mirrors /api/auth/logout).
 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
