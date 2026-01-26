"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createWorkspaceSchema, updateWorkspaceSchema } from "@/lib/validations/workspace";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createWorkspace(data: { name: string; slug?: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createWorkspaceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const slug = validated.data.slug || generateSlug(validated.data.name);

  // Check if slug is taken
  const existing = await db.workspace.findUnique({
    where: { slug },
  });

  if (existing) {
    return { error: "A workspace with this URL already exists" };
  }

  try {
    const workspace = await db.workspace.create({
      data: {
        name: validated.data.name,
        slug,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    revalidatePath("/workspace");
    return { data: workspace };
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return { error: "Failed to create workspace" };
  }
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; slug?: string }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateWorkspaceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Check ownership
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: session.user.id, role: "ADMIN" },
      },
    },
  });

  if (!workspace) {
    return { error: "Workspace not found" };
  }

  const isAdmin =
    workspace.ownerId === session.user.id || workspace.members.length > 0;

  if (!isAdmin) {
    return { error: "You don't have permission to update this workspace" };
  }

  // Check if new slug is taken
  if (validated.data.slug && validated.data.slug !== workspace.slug) {
    const existing = await db.workspace.findUnique({
      where: { slug: validated.data.slug },
    });
    if (existing) {
      return { error: "A workspace with this URL already exists" };
    }
  }

  try {
    const updated = await db.workspace.update({
      where: { id: workspaceId },
      data: validated.data,
    });

    revalidatePath(`/workspace/${workspace.slug}`);
    if (validated.data.slug) {
      revalidatePath(`/workspace/${validated.data.slug}`);
    }
    return { data: updated };
  } catch (error) {
    console.error("Failed to update workspace:", error);
    return { error: "Failed to update workspace" };
  }
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return { error: "Workspace not found" };
  }

  if (workspace.ownerId !== session.user.id) {
    return { error: "Only the owner can delete this workspace" };
  }

  try {
    await db.workspace.delete({
      where: { id: workspaceId },
    });

    revalidatePath("/workspace");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    return { error: "Failed to delete workspace" };
  }
}
