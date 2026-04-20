import { NextResponse } from "next/server";

import { ensureDatabaseReady } from "@/lib/db";

export const dynamic = "force-dynamic";

function getUrlScheme(value: string) {
  const match = value.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  return match?.[1]?.toLowerCase() ?? null;
}

function safeHostFromUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.host || null;
  } catch {
    return null;
  }
}

function redactHost(host: string | null) {
  if (!host) return null;
  const lowered = host.toLowerCase();
  if (lowered.endsWith("turso.io")) return "turso.io";
  const parts = lowered.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  return parts.slice(-2).join(".");
}

export async function GET() {
  const startedAt = Date.now();
  const isVercel = process.env.VERCEL === "1";

  const rawDbUrl = process.env.DATABASE_URL?.trim() || "";
  const dbUrlScheme = rawDbUrl ? getUrlScheme(rawDbUrl) : null;
  const dbUrlHost = rawDbUrl ? redactHost(safeHostFromUrl(rawDbUrl)) : null;

  let dbOk = false;
  let dbError: string | null = null;

  try {
    const db = await ensureDatabaseReady();
    await db.execute("SELECT 1 AS ok");
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(
    {
      ok: dbOk,
      now: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      runtime: {
        node: process.version,
        vercel: isVercel,
        vercelRegion: process.env.VERCEL_REGION ?? null,
      },
      database: {
        ok: dbOk,
        hasUrl: Boolean(rawDbUrl),
        urlScheme: dbUrlScheme,
        urlHost: dbUrlHost,
        hasAuthToken: Boolean(process.env.DATABASE_AUTH_TOKEN?.trim()),
        error: dbError,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

