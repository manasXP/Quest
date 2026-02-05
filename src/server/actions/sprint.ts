"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createSprintSchema, updateSprintSchema } from "@/lib/validations/sprint";
import type { SprintStatus } from "@prisma/client";

export async function createSprint(data: {
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  projectId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createSprintSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const project = await db.project.findUnique({
    where: { id: validated.data.projectId },
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
    return { error: "You don't have access to this project" };
  }

  // Check for duplicate sprint name
  const existing = await db.sprint.findUnique({
    where: {
      projectId_name: {
        projectId: validated.data.projectId,
        name: validated.data.name,
      },
    },
  });

  if (existing) {
    return { error: "A sprint with this name already exists in this project" };
  }

  try {
    const sprint = await db.sprint.create({
      data: {
        name: validated.data.name,
        goal: validated.data.goal,
        startDate: validated.data.startDate,
        endDate: validated.data.endDate,
        projectId: validated.data.projectId,
      },
    });

    revalidatePath(`/workspace/${project.workspace.slug}/projects/${project.key}`);
    return { data: sprint };
  } catch (error) {
    console.error("Failed to create sprint:", error);
    return { error: "Failed to create sprint" };
  }
}

export async function updateSprint(
  sprintId: string,
  data: {
    name?: string;
    goal?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    status?: SprintStatus;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateSprintSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: session.user.id },
              },
            },
          },
        },
      },
    },
  });

  if (!sprint) {
    return { error: "Sprint not found" };
  }

  const hasAccess =
    sprint.project.workspace.ownerId === session.user.id ||
    sprint.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to update this sprint" };
  }

  // Check for duplicate name if name is being changed
  if (validated.data.name && validated.data.name !== sprint.name) {
    const existing = await db.sprint.findUnique({
      where: {
        projectId_name: {
          projectId: sprint.projectId,
          name: validated.data.name,
        },
      },
    });
    if (existing) {
      return { error: "A sprint with this name already exists" };
    }
  }

  try {
    const updated = await db.sprint.update({
      where: { id: sprintId },
      data: validated.data,
    });

    revalidatePath(`/workspace/${sprint.project.workspace.slug}/projects/${sprint.project.key}`);
    return { data: updated };
  } catch (error) {
    console.error("Failed to update sprint:", error);
    return { error: "Failed to update sprint" };
  }
}

export async function deleteSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: session.user.id },
              },
            },
          },
        },
      },
    },
  });

  if (!sprint) {
    return { error: "Sprint not found" };
  }

  const hasAccess =
    sprint.project.workspace.ownerId === session.user.id ||
    sprint.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to delete this sprint" };
  }

  try {
    await db.sprint.delete({
      where: { id: sprintId },
    });

    revalidatePath(`/workspace/${sprint.project.workspace.slug}/projects/${sprint.project.key}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete sprint:", error);
    return { error: "Failed to delete sprint" };
  }
}

export async function getProjectSprints(projectId: string) {
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
    return { error: "You don't have access to this project" };
  }

  try {
    const sprints = await db.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        goal: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    return { data: sprints };
  } catch (error) {
    console.error("Failed to get sprints:", error);
    return { error: "Failed to get sprints" };
  }
}
