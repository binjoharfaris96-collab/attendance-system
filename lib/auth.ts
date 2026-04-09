import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSetting, updateSetting } from "@/lib/db";
import type { Session } from "@/lib/types";

const SESSION_COOKIE = "rollcall_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

const AUTH_EMAIL_KEY = "admin_email";
const AUTH_PASSWORD_HASH_KEY = "admin_password_hash";
const PASSWORD_HASH_PREFIX = "scrypt";

type SessionPayload = {
  email: string;
  exp: number;
};

function getEnvAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com";
}

function getEnvAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "ChangeMe123!";
}

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || "dev-secret-change-me";
}

function getStoredAdminEmail() {
  const value = getSetting(AUTH_EMAIL_KEY, "").trim().toLowerCase();
  return value || null;
}

function getStoredAdminPasswordHash() {
  const value = getSetting(AUTH_PASSWORD_HASH_KEY, "").trim();
  return value || null;
}

function getResolvedAdminEmail() {
  return getStoredAdminEmail() ?? getEnvAdminEmail();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `${PASSWORD_HASH_PREFIX}:${salt}:${hash}`;
}

function verifyHashedPassword(password: string, storedHash: string) {
  try {
    const [prefix, salt, hashBase64] = storedHash.split(":");
    if (!prefix || !salt || !hashBase64 || prefix !== PASSWORD_HASH_PREFIX) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hashBase64, "base64url");

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function validateCurrentAdminPassword(password: string) {
  const storedHash = getStoredAdminPasswordHash();
  if (storedHash) {
    return verifyHashedPassword(password, storedHash);
  }

  return password === getEnvAdminPassword();
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

    if (!payload.email || typeof payload.exp !== "number") {
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
    expiresAt: payload.exp,
  };
}

export function getAuthDefaults() {
  const hasStoredAuth =
    Boolean(getStoredAdminEmail()) || Boolean(getStoredAdminPasswordHash());

  return {
    email: getResolvedAdminEmail(),
    password: getEnvAdminPassword(),
    isUsingFallbackCredentials:
      !hasStoredAuth && !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD,
  };
}

export async function validateLogin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    normalizedEmail === getResolvedAdminEmail() &&
    validateCurrentAdminPassword(password)
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

  if (!validateCurrentAdminPassword(currentPassword)) {
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

  const currentEmail = getResolvedAdminEmail();
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
    updateSetting(AUTH_EMAIL_KEY, nextEmail);
  }

  if (shouldUpdatePassword) {
    updateSetting(AUTH_PASSWORD_HASH_KEY, hashPassword(nextPassword));
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
  const payload = encodePayload({
    email,
    exp: Date.now() + SESSION_DURATION_MS,
  });
  const signature = signPayload(payload).toString("base64url");

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifyToken(token);

  return payload ? toSession(payload) : null;
});

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
