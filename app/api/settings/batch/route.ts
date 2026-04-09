import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { updateSetting } from "@/lib/db";

type SettingUpdate = {
  key: string;
  value: string;
};

function isValidUpdate(value: unknown): value is SettingUpdate {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && typeof record.value === "string";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("rollcall_session")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { updates?: unknown };
    const rawUpdates = Array.isArray(payload?.updates) ? payload.updates : [];
    const updates = rawUpdates.filter(isValidUpdate);

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No valid updates provided" }, { status: 400 });
    }

    for (const update of updates) {
      updateSetting(update.key, update.value);
    }

    revalidatePath("/", "layout");
    const response = NextResponse.json({ success: true });

    for (const update of updates) {
      if (update.key === "app_language" && (update.value === "en" || update.value === "ar")) {
        response.cookies.set("app_language", update.value, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      }

      if (update.key === "theme_preference" && (update.value === "light" || update.value === "dark")) {
        response.cookies.set("theme_preference", update.value, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Failed to save settings batch via API:", error);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
