import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createSession } from "@/lib/auth";

/**
 * GET /api/auth/callback/google
 *
 * Handles the OAuth 2.0 callback from Google.
 * 1. Validates CSRF state
 * 2. Exchanges authorization code for tokens
 * 3. Fetches user profile
 * 4. Validates email domain
 * 5. Creates session using existing createSession()
 * 6. Redirects to dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // If Google returned an error (e.g. user cancelled)
  if (error) {
    return NextResponse.redirect(new URL("/login?error=cancelled", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=csrf", request.url));
  }

  // Clear the state cookie
  cookieStore.delete("oauth_state");

  // Exchange code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  const baseUrl = process.env.NEXTAUTH_URL
    ? process.env.NEXTAUTH_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(new URL("/login?error=token", request.url));
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      id_token?: string;
    };

    // Fetch user profile from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error("Google userinfo fetch failed:", await userInfoResponse.text());
      return NextResponse.redirect(new URL("/login?error=profile", request.url));
    }

    const userInfo = (await userInfoResponse.json()) as {
      email: string;
      name?: string;
      picture?: string;
      verified_email?: boolean;
    };

    const email = userInfo.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=no_email", request.url));
    }

    // Domain validation — hardcoded fallback ensures it ALWAYS blocks non-school emails
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "stu.kfs.sch.sa").trim().toLowerCase();
    const emailDomain = email.split("@")[1];
    console.log(`[OAuth] Email: ${email}, Domain: ${emailDomain}, Allowed: ${allowedDomain}`);
    if (emailDomain !== allowedDomain) {
      console.log(`[OAuth] BLOCKED: ${email} — domain "${emailDomain}" is not "${allowedDomain}"`);
      return NextResponse.redirect(new URL("/login?error=domain", request.url));
    }

    // Success! Create session using the EXISTING session system — no changes needed
    await createSession(email);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=server", request.url));
  }
}
