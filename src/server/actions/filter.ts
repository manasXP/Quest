"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createSavedFilterSchema,
  updateSavedFilterSchema,
} from "@/lib/validations/filter";
import type { IssueFilters } from "@/lib/validations/search";

export async function createSavedFilter(data: {
  name: string;
  filters: IssueFilters;
  projectId: string;
  isDefault?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createSavedFilterSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Check project access
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

  try {
    // If this filter is being set as default, unset other defaults
    if (validated.data.isDefault) {
      await db.savedFilter.updateMany({
        where: {
          projectId: validated.data.projectId,
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const savedFilter = await db.savedFilter.create({
      data: {
        name: validated.data.name,
        filters: validated.data.filters,
        projectId: validated.data.projectId,
        userId: session.user.id,
        isDefault: validated.data.isDefault || false,
      },
    });

    revalidatePath(`/workspace/${project.workspace.slug}/project/${project.key}`);
    return { data: savedFilter };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A filter with this name already exists" };
    }
    console.error("Failed to create saved filter:", error);
    return { error: "Failed to save filter" };
  }
}

export async function updateSavedFilter(
  filterId: string,
  data: {
    name?: string;
    filters?: IssueFilters;
    isDefault?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateSavedFilterSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const savedFilter = await db.savedFilter.findUnique({
    where: { id: filterId },
    include: {
      project: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!savedFilter) {
    return { error: "Filter not found" };
  }

  if (savedFilter.userId !== session.user.id) {
    return { error: "You can only update your own filters" };
  }

  try {
    // If setting as default, unset other defaults
    if (validated.data.isDefault) {
      await db.savedFilter.updateMany({
        where: {
          projectId: savedFilter.projectId,
          userId: session.user.id,
          isDefault: true,
          id: { not: filterId },
        },
        data: { isDefault: false },
      });
    }

    const updated = await db.savedFilter.update({
      where: { id: filterId },
      data: validated.data,
    });

    revalidatePath(
      `/workspace/${savedFilter.project.workspace.slug}/project/${savedFilter.project.key}`
    );
    return { data: updated };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A filter with this name already exists" };
    }
    console.error("Failed to update saved filter:", error);
    return { error: "Failed to update filter" };
  }
}

export async function deleteSavedFilter(filterId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const savedFilter = await db.savedFilter.findUnique({
    where: { id: filterId },
    include: {
      project: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!savedFilter) {
    return { error: "Filter not found" };
  }

  if (savedFilter.userId !== session.user.id) {
    return { error: "You can only delete your own filters" };
  }

  try {
    await db.savedFilter.delete({
      where: { id: filterId },
    });

    revalidatePath(
      `/workspace/${savedFilter.project.workspace.slug}/project/${savedFilter.project.key}`
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete saved filter:", error);
    return { error: "Failed to delete filter" };
  }
}

export async function getSavedFilters(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.savedFilter.findMany({
    where: {
      projectId,
      userId: session.user.id,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getDefaultFilter(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.savedFilter.findFirst({
    where: {
      projectId,
      userId: session.user.id,
      isDefault: true,
    },
  });
}
