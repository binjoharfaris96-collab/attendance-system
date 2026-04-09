import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { exportSystemBackup, restoreSystemBackup } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureAuthenticated() {
  try {
    await requireSession();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backupPayload = exportSystemBackup();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `attendance-backup-${timestamp}.json`;

  return new NextResponse(JSON.stringify(backupPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploaded = formData.get("backupFile");

  if (!(uploaded instanceof File)) {
    return NextResponse.json(
      { error: "Please choose a backup JSON file." },
      { status: 400 },
    );
  }

  let parsedBackup: unknown;
  try {
    const rawText = await uploaded.text();
    parsedBackup = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Backup file is not valid JSON." },
      { status: 400 },
    );
  }

  try {
    restoreSystemBackup(parsedBackup);
  } catch (error) {
    console.error("Backup restore failed:", error);
    return NextResponse.json(
      { error: "Backup restore failed. Please check the file contents." },
      { status: 400 },
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/attendance");
  revalidatePath("/statistics");
  revalidatePath("/warnings");
  revalidatePath("/behavior");
  revalidatePath("/device-logs");
  revalidatePath("/settings");
  revalidatePath("/exam-monitor");
  revalidatePath("/recognition");

  return NextResponse.json({
    success: true,
    message: "Backup restored successfully.",
  });
}
