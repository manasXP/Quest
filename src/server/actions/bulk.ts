"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  bulkUpdateStatusSchema,
  bulkAssignSchema,
  bulkUpdatePrioritySchema,
  bulkDeleteSchema,
} from "@/lib/validations/bulk";
import { logActivity } from "./activity";
import type { IssueStatus, IssuePriority } from "@prisma/client";

async function validateBulkAccess(issueIds: string[], userId: string) {
  const issues = await db.issue.findMany({
    where: { id: { in: issueIds } },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  if (issues.length !== issueIds.length) {
    return { error: "Some issues were not found" };
  }

  const unauthorized = issues.filter((issue) => {
    const workspace = issue.project.workspace;
    return workspace.ownerId !== userId && workspace.members.length === 0;
  });

  if (unauthorized.length > 0) {
    return { error: "You don't have permission to modify some of these issues" };
  }

  return { issues };
}

export async function bulkUpdateStatus(data: {
  issueIds: string[];
  status: IssueStatus;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = bulkUpdateStatusSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const accessCheck = await validateBulkAccess(validated.data.issueIds, session.user.id);
  if ("error" in accessCheck) {
    return accessCheck;
  }

  try {
    const { issues } = accessCheck;

    // Update all issues
    await db.issue.updateMany({
      where: { id: { in: validated.data.issueIds } },
      data: { status: validated.data.status },
    });

    // Log activity for each issue
    await Promise.all(
      issues.map((issue) =>
        logActivity({
          action: "ISSUE_STATUS_CHANGED",
          issueId: issue.id,
          actorId: session.user.id,
          metadata: {
            field: "status",
            oldValue: issue.status,
            newValue: validated.data.status,
          },
        })
      )
    );

    // Revalidate paths for all affected projects
    const projectPaths = new Set(
      issues.map(
        (issue) =>
          `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
      )
    );
    projectPaths.forEach((path) => revalidatePath(path));

    return { success: true, count: validated.data.issueIds.length };
  } catch (error) {
    console.error("Failed to bulk update status:", error);
    return { error: "Failed to update issues" };
  }
}

export async function bulkAssign(data: {
  issueIds: string[];
  assigneeId: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = bulkAssignSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const accessCheck = await validateBulkAccess(validated.data.issueIds, session.user.id);
  if ("error" in accessCheck) {
    return accessCheck;
  }

  try {
    const { issues } = accessCheck;

    // Update all issues
    await db.issue.updateMany({
      where: { id: { in: validated.data.issueIds } },
      data: { assigneeId: validated.data.assigneeId },
    });

    // Log activity for each issue
    await Promise.all(
      issues.map((issue) =>
        logActivity({
          action: "ISSUE_ASSIGNED",
          issueId: issue.id,
          actorId: session.user.id,
          metadata: {
            field: "assignee",
            oldValue: issue.assigneeId,
            newValue: validated.data.assigneeId,
          },
        })
      )
    );

    // Revalidate paths
    const projectPaths = new Set(
      issues.map(
        (issue) =>
          `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
      )
    );
    projectPaths.forEach((path) => revalidatePath(path));

    return { success: true, count: validated.data.issueIds.length };
  } catch (error) {
    console.error("Failed to bulk assign:", error);
    return { error: "Failed to assign issues" };
  }
}

export async function bulkUpdatePriority(data: {
  issueIds: string[];
  priority: IssuePriority;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = bulkUpdatePrioritySchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const accessCheck = await validateBulkAccess(validated.data.issueIds, session.user.id);
  if ("error" in accessCheck) {
    return accessCheck;
  }

  try {
    const { issues } = accessCheck;

    // Update all issues
    await db.issue.updateMany({
      where: { id: { in: validated.data.issueIds } },
      data: { priority: validated.data.priority },
    });

    // Log activity for each issue
    await Promise.all(
      issues.map((issue) =>
        logActivity({
          action: "ISSUE_PRIORITY_CHANGED",
          issueId: issue.id,
          actorId: session.user.id,
          metadata: {
            field: "priority",
            oldValue: issue.priority,
            newValue: validated.data.priority,
          },
        })
      )
    );

    // Revalidate paths
    const projectPaths = new Set(
      issues.map(
        (issue) =>
          `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
      )
    );
    projectPaths.forEach((path) => revalidatePath(path));

    return { success: true, count: validated.data.issueIds.length };
  } catch (error) {
    console.error("Failed to bulk update priority:", error);
    return { error: "Failed to update issues" };
  }
}

export async function bulkDelete(data: { issueIds: string[] }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = bulkDeleteSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const accessCheck = await validateBulkAccess(validated.data.issueIds, session.user.id);
  if ("error" in accessCheck) {
    return accessCheck;
  }

  try {
    const { issues } = accessCheck;

    // Delete all issues
    await db.issue.deleteMany({
      where: { id: { in: validated.data.issueIds } },
    });

    // Revalidate paths
    const projectPaths = new Set(
      issues.map(
        (issue) =>
          `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
      )
    );
    projectPaths.forEach((path) => revalidatePath(path));

    return { success: true, count: validated.data.issueIds.length };
  } catch (error) {
    console.error("Failed to bulk delete:", error);
    return { error: "Failed to delete issues" };
  }
}
