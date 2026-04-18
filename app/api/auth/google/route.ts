import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * GET /api/auth/google
 *
 * Redirects the user to Google's OAuth 2.0 consent screen.
 * A CSRF state token is stored in a short-lived cookie for verification on callback.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID in environment variables." },
      { status: 500 },
    );
  }

  // Determine the callback URL — use request origin for localhost, NEXTAUTH_URL for production
  const origin = request.nextUrl.origin;
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  const baseUrl = isLocalhost
    ? origin
    : (process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin);
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/callback/google`;

  // Generate a CSRF state token and store it in a cookie
  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
