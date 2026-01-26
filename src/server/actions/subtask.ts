"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createSubtaskSchema,
  updateSubtaskStatusSchema,
} from "@/lib/validations/subtask";
import { logActivity } from "./activity";

async function getNextIssueNumber(projectId: string): Promise<number> {
  const lastIssue = await db.issue.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { key: true },
  });

  if (!lastIssue) return 1;

  const match = lastIssue.key.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}

export async function createSubtask(data: {
  title: string;
  description?: string;
  type?: "TASK" | "BUG";
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  parentId: string;
  assigneeId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createSubtaskSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Get parent issue with project info
  const parentIssue = await db.issue.findUnique({
    where: { id: validated.data.parentId },
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

  if (!parentIssue) {
    return { error: "Parent issue not found" };
  }

  // Check if parent is already a subtask (prevent nested subtasks)
  if (parentIssue.parentId) {
    return { error: "Cannot create subtask of a subtask" };
  }

  const hasAccess =
    parentIssue.project.workspace.ownerId === session.user.id ||
    parentIssue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have access to this project" };
  }

  try {
    const issueNumber = await getNextIssueNumber(parentIssue.projectId);
    const issueKey = `${parentIssue.project.key}-${issueNumber}`;

    // Get max order for subtasks under this parent
    const maxOrder = await db.issue.aggregate({
      where: {
        parentId: validated.data.parentId,
      },
      _max: { order: true },
    });

    const subtask = await db.issue.create({
      data: {
        key: issueKey,
        title: validated.data.title,
        description: validated.data.description,
        type: validated.data.type || "TASK",
        priority: validated.data.priority || "MEDIUM",
        status: "TODO",
        projectId: parentIssue.projectId,
        reporterId: session.user.id,
        assigneeId: validated.data.assigneeId,
        parentId: validated.data.parentId,
        order: (maxOrder._max.order || 0) + 1,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "ISSUE_CREATED",
      issueId: subtask.id,
      actorId: session.user.id,
    });

    revalidatePath(
      `/workspace/${parentIssue.project.workspace.slug}/project/${parentIssue.project.key}`
    );
    return { data: subtask };
  } catch (error) {
    console.error("Failed to create subtask:", error);
    return { error: "Failed to create subtask" };
  }
}

export async function updateSubtaskStatus(data: {
  subtaskId: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateSubtaskStatusSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const subtask = await db.issue.findUnique({
    where: { id: validated.data.subtaskId },
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

  if (!subtask) {
    return { error: "Subtask not found" };
  }

  const hasAccess =
    subtask.project.workspace.ownerId === session.user.id ||
    subtask.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to update this subtask" };
  }

  try {
    const updated = await db.issue.update({
      where: { id: validated.data.subtaskId },
      data: {
        status: validated.data.status,
      },
    });

    // Log status change
    if (validated.data.status !== subtask.status) {
      await logActivity({
        action: "ISSUE_STATUS_CHANGED",
        issueId: subtask.id,
        actorId: session.user.id,
        metadata: {
          field: "status",
          oldValue: subtask.status,
          newValue: validated.data.status,
        },
      });
    }

    revalidatePath(
      `/workspace/${subtask.project.workspace.slug}/project/${subtask.project.key}`
    );
    return { data: updated };
  } catch (error) {
    console.error("Failed to update subtask status:", error);
    return { error: "Failed to update subtask status" };
  }
}

export async function getSubtasksByParent(parentId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const subtasks = await db.issue.findMany({
    where: {
      parentId,
    },
    select: {
      id: true,
      key: true,
      title: true,
      type: true,
      priority: true,
      status: true,
    },
    orderBy: [{ status: "asc" }, { order: "asc" }],
  });

  return subtasks;
}
