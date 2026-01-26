"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user";

export async function updateProfile(input: UpdateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateProfileSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: validated.data.name },
    });

    revalidatePath("/settings");
    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile" };
  }
}
