"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";

export async function createProject(data: {
  name: string;
  key: string;
  description?: string;
  workspaceId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createProjectSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Check workspace access
  const workspace = await db.workspace.findUnique({
    where: { id: validated.data.workspaceId },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    return { error: "Workspace not found" };
  }

  const hasAccess =
    workspace.ownerId === session.user.id || workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have access to this workspace" };
  }

  // Check if key is taken in this workspace
  const existing = await db.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId: validated.data.workspaceId,
        key: validated.data.key,
      },
    },
  });

  if (existing) {
    return { error: "A project with this key already exists in this workspace" };
  }

  try {
    const project = await db.project.create({
      data: {
        name: validated.data.name,
        key: validated.data.key,
        description: validated.data.description,
        workspaceId: validated.data.workspaceId,
        leadId: session.user.id,
      },
    });

    revalidatePath(`/workspace/${workspace.slug}`);
    return { data: project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
}

export async function updateProject(
  projectId: string,
  data: { name?: string; key?: string; description?: string; leadId?: string }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateProjectSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const hasAccess =
    project.workspace.ownerId === session.user.id ||
    project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to update this project" };
  }

  // Check if new key is taken
  if (validated.data.key && validated.data.key !== project.key) {
    const existing = await db.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: project.workspaceId,
          key: validated.data.key,
        },
      },
    });
    if (existing) {
      return { error: "A project with this key already exists" };
    }
  }

  try {
    const updated = await db.project.update({
      where: { id: projectId },
      data: validated.data,
    });

    revalidatePath(`/workspace/${project.workspace.slug}`);
    return { data: updated };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { error: "Failed to update project" };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: session.user.id, role: "ADMIN" },
          },
        },
      },
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const isAdmin =
    project.workspace.ownerId === session.user.id ||
    project.workspace.members.length > 0;

  if (!isAdmin) {
    return { error: "Only admins can delete projects" };
  }

  try {
    await db.project.delete({
      where: { id: projectId },
    });

    revalidatePath(`/workspace/${project.workspace.slug}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { error: "Failed to delete project" };
  }
}
