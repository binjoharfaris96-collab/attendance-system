"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { 
  createBuilding, 
  deleteBuilding, 
  updateUserBuilding 
} from "@/lib/db";

/**
 * Ensures the session user is an 'owner'. 
 * Only owners can manage buildings and assign admins to them.
 */
async function requireOwner() {
  const session = await requireSession();
  if (session.role !== "owner") {
    throw new Error("Access denied. Owner privileges required.");
  }
  return session;
}

export async function createBuildingAction(formData: FormData) {
  try {
    await requireOwner();
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;

    if (!name) return { error: "Building name is required" };

    await createBuilding({ name, address });
    revalidatePath("/buildings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create building" };
  }
}

export async function deleteBuildingAction(id: string) {
  try {
    await requireOwner();
    await deleteBuilding(id);
    revalidatePath("/buildings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete building" };
  }
}

export async function assignAdminToBuildingAction(userId: string, buildingId: string | null) {
  try {
    await requireOwner();
    await updateUserBuilding(userId, buildingId);
    revalidatePath("/buildings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to assign building" };
  }
}
