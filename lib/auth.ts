import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import bcrypt from "bcrypt";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSetting, getUserByEmail, updateSetting } from "@/lib/db";
import type { Session } from "@/lib/types";

const SESSION_COOKIE = "rollcall_session";
// Session duration: 365 days (effectively "forever" for most use cases)
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 365;

const AUTH_EMAIL_KEY = "admin_email";
const AUTH_PASSWORD_HASH_KEY = "admin_password_hash";

type SessionPayload = {
  email: string;
  role: string;
  buildingId: string | null;
  exp: number;
};

function getEnvAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
}

function getEnvAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || null;
}

function getSessionSecret() {
  return process.env.AUTH_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || "dev-secret-change-me";
}

async function getStoredAdminEmail() {
  try {
    const value = (await getSetting(AUTH_EMAIL_KEY, "")).trim().toLowerCase();
    return value || null;
  } catch {
    // If DB isn't configured/reachable (common on fresh deploys), don't crash login.
    return null;
  }
}

async function getStoredAdminPasswordHash() {
  try {
    const value = (await getSetting(AUTH_PASSWORD_HASH_KEY, "")).trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function getResolvedAdminEmail() {
  return getEnvAdminEmail() ?? (await getStoredAdminEmail()) ?? "admin@example.com";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyHashedPassword(password: string, storedHash: string) {
  try {
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
      return bcrypt.compare(password, storedHash);
    }

    // Backward compatibility with previous scrypt format.
    const [prefix, salt, hashBase64] = storedHash.split(":");
    if (!prefix || !salt || !hashBase64 || prefix !== "scrypt") return false;
    const { scryptSync } = await import("node:crypto");
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hashBase64, "base64url");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

async function validateCurrentAdminPassword(password: string) {
  const envPassword = getEnvAdminPassword();
  if (envPassword) {
    return password === envPassword;
  }

  const storedHash = await getStoredAdminPasswordHash();
  if (storedHash) {
    return await verifyHashedPassword(password, storedHash);
  }

  return password === "ChangeMe123!";
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
}

function verifyToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const signature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = signPayload(encodedPayload);

    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(signature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.email || !payload.role || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function toSession(payload: SessionPayload): Session {
  return {
    email: payload.email,
    role: payload.role,
    buildingId: payload.buildingId,
    expiresAt: payload.exp,
  };
}

export async function getAuthDefaults() {
  const hasStoredAuth =
    Boolean(await getStoredAdminEmail()) || Boolean(await getStoredAdminPasswordHash());

  return {
    email: await getResolvedAdminEmail(),
    password: getEnvAdminPassword(),
    isUsingFallbackCredentials:
      !hasStoredAuth && !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD,
  };
}

export async function validateLogin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Check users table
  try {
    const user = await getUserByEmail(normalizedEmail);
    if (user) {
      return await verifyHashedPassword(password, user.passwordHash);
    }
  } catch {
    // Fall back to legacy admin check if DB isn't available.
  }

  // 2. Fallback to legacy admin check
  return (
    normalizedEmail === (await getResolvedAdminEmail()) &&
    (await validateCurrentAdminPassword(password))
  );
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  nextEmail: string;
  nextPassword: string;
}) {
  const currentPassword = input.currentPassword;
  const nextEmail = input.nextEmail.trim().toLowerCase();
  const nextPassword = input.nextPassword;

  if (!nextEmail) {
    return {
      success: false,
      message: "Username cannot be empty.",
    };
  }

  if (!currentPassword) {
    return {
      success: false,
      message: "Enter your current password to confirm changes.",
    };
  }

  if (!(await validateCurrentAdminPassword(currentPassword))) {
    return {
      success: false,
      message: "Current password is incorrect.",
    };
  }

  if (nextPassword && nextPassword.length < 8) {
    return {
      success: false,
      message: "New password must be at least 8 characters.",
    };
  }

  const currentEmail = await getResolvedAdminEmail();
  const shouldUpdateEmail = nextEmail !== currentEmail;
  const shouldUpdatePassword = nextPassword.length > 0;

  if (!shouldUpdateEmail && !shouldUpdatePassword) {
    return {
      success: false,
      message: "No account changes to save.",
      nextEmail: currentEmail,
    };
  }

  if (shouldUpdateEmail) {
    try {
      await updateSetting(AUTH_EMAIL_KEY, nextEmail);
    } catch {
      return {
        success: false,
        message: "Database is not configured. Set DATABASE_URL on the server and try again.",
      };
    }
  }

  if (shouldUpdatePassword) {
    try {
      await updateSetting(AUTH_PASSWORD_HASH_KEY, await hashPassword(nextPassword));
    } catch {
      return {
        success: false,
        message: "Database is not configured. Set DATABASE_URL on the server and try again.",
      };
    }
  }

  return {
    success: true,
    message: shouldUpdateEmail && shouldUpdatePassword
      ? "Username and password updated successfully."
      : shouldUpdateEmail
        ? "Username updated successfully."
        : "Password updated successfully.",
    nextEmail: shouldUpdateEmail ? nextEmail : currentEmail,
  };
}

export async function createSession(email: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, email, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  console.log("COOKIE SET (Server Action):", email);
}

export async function createSessionResponse(email: string, targetUrl: URL | string) {
  const response = NextResponse.redirect(targetUrl);

  response.cookies.set(SESSION_COOKIE, email, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  console.log("COOKIE SET (NextResponse):", email);

  return response;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const rawEmail = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawEmail) return null;

  const email = rawEmail.toLowerCase().trim();
  const user = await (async () => {
    try {
      return await getUserByEmail(email);
    } catch {
      return null;
    }
  })();

  console.log("SESSION COOKIE:", rawEmail);
  console.log("USER FOUND:", user ? user.email : "null");

  const resolvedAdminEmail = await getResolvedAdminEmail();
  const isAdminEmail = email === resolvedAdminEmail;
  const role = isAdminEmail ? "owner" : (user?.role || "admin");
  const buildingId = user?.buildingId || null;

  return {
    email,
    role,
    buildingId,
    expiresAt: Date.now() + 86400000,
  };
});

export async function requireSession() {
  const session = await getSession();
  console.log("SESSION CHECK (requireSession):", session ? session.email : "none");

  if (!session) {
    redirect("/login");
  }

  return session;
}
