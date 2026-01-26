"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createIssueSchema,
  updateIssueSchema,
  moveIssueSchema,
} from "@/lib/validations/issue";
import { logActivity } from "./activity";
import { notifyIssueAssigned, notifyIssueCompleted } from "./notification";
import type { IssueStatus } from "@prisma/client";

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

export async function createIssue(data: {
  title: string;
  description?: string;
  type?: "EPIC" | "STORY" | "TASK" | "BUG";
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  projectId: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  parentId?: string | null;
  labelIds?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createIssueSchema.safeParse(data);
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

  try {
    const issueNumber = await getNextIssueNumber(validated.data.projectId);
    const issueKey = `${project.key}-${issueNumber}`;

    // Get max order for the status
    const maxOrder = await db.issue.aggregate({
      where: {
        projectId: validated.data.projectId,
        status: "BACKLOG",
      },
      _max: { order: true },
    });

    const issue = await db.issue.create({
      data: {
        key: issueKey,
        title: validated.data.title,
        description: validated.data.description,
        type: validated.data.type || "TASK",
        priority: validated.data.priority || "MEDIUM",
        status: "BACKLOG",
        projectId: validated.data.projectId,
        reporterId: session.user.id,
        assigneeId: validated.data.assigneeId,
        dueDate: validated.data.dueDate,
        parentId: validated.data.parentId,
        order: (maxOrder._max.order || 0) + 1,
        labels: validated.data.labelIds
          ? {
              create: validated.data.labelIds.map((labelId) => ({
                labelId,
              })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "ISSUE_CREATED",
      issueId: issue.id,
      actorId: session.user.id,
    });

    revalidatePath(`/workspace/${project.workspace.slug}/project/${project.key}`);
    return { data: issue };
  } catch (error) {
    console.error("Failed to create issue:", error);
    return { error: "Failed to create issue" };
  }
}

export async function updateIssue(
  issueId: string,
  data: {
    title?: string;
    description?: string | null;
    type?: "EPIC" | "STORY" | "TASK" | "BUG";
    status?: IssueStatus;
    priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
    assigneeId?: string | null;
    dueDate?: Date | null;
    order?: number;
    labelIds?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateIssueSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const issue = await db.issue.findUnique({
    where: { id: issueId },
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

  if (!issue) {
    return { error: "Issue not found" };
  }

  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to update this issue" };
  }

  try {
    const { labelIds, ...updateData } = validated.data;

    const updated = await db.issue.update({
      where: { id: issueId },
      data: {
        ...updateData,
        labels: labelIds
          ? {
              deleteMany: {},
              create: labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        labels: {
          include: { label: true },
        },
      },
    });

    const projectPath = `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`;

    // Log activities for specific changes
    if (validated.data.status && validated.data.status !== issue.status) {
      await logActivity({
        action: "ISSUE_STATUS_CHANGED",
        issueId: issue.id,
        actorId: session.user.id,
        metadata: {
          field: "status",
          oldValue: issue.status,
          newValue: validated.data.status,
        },
      });

      // Notify reporter when issue is completed
      if (validated.data.status === "DONE") {
        await notifyIssueCompleted({
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          reporterId: issue.reporterId,
          actorId: session.user.id,
          projectPath,
        });
      }
    }

    if (validated.data.assigneeId !== undefined && validated.data.assigneeId !== issue.assigneeId) {
      await logActivity({
        action: "ISSUE_ASSIGNED",
        issueId: issue.id,
        actorId: session.user.id,
        metadata: {
          field: "assignee",
          oldValue: issue.assigneeId,
          newValue: validated.data.assigneeId,
        },
      });

      // Notify new assignee
      if (validated.data.assigneeId) {
        await notifyIssueAssigned({
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          assigneeId: validated.data.assigneeId,
          actorId: session.user.id,
          projectPath,
        });
      }
    }

    if (validated.data.priority && validated.data.priority !== issue.priority) {
      await logActivity({
        action: "ISSUE_PRIORITY_CHANGED",
        issueId: issue.id,
        actorId: session.user.id,
        metadata: {
          field: "priority",
          oldValue: issue.priority,
          newValue: validated.data.priority,
        },
      });
    }

    // Log general update for other fields
    const hasOtherChanges =
      (validated.data.title && validated.data.title !== issue.title) ||
      (validated.data.description !== undefined && validated.data.description !== issue.description) ||
      (validated.data.type && validated.data.type !== issue.type);

    if (hasOtherChanges) {
      await logActivity({
        action: "ISSUE_UPDATED",
        issueId: issue.id,
        actorId: session.user.id,
      });
    }

    revalidatePath(
      `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
    );
    return { data: updated };
  } catch (error) {
    console.error("Failed to update issue:", error);
    return { error: "Failed to update issue" };
  }
}

export async function moveIssue(data: {
  issueId: string;
  status: IssueStatus;
  order: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = moveIssueSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const issue = await db.issue.findUnique({
    where: { id: validated.data.issueId },
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

  if (!issue) {
    return { error: "Issue not found" };
  }

  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to move this issue" };
  }

  try {
    const updated = await db.issue.update({
      where: { id: validated.data.issueId },
      data: {
        status: validated.data.status,
        order: validated.data.order,
      },
    });

    const projectPath = `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`;

    // Log status change if status actually changed
    if (validated.data.status !== issue.status) {
      await logActivity({
        action: "ISSUE_STATUS_CHANGED",
        issueId: issue.id,
        actorId: session.user.id,
        metadata: {
          field: "status",
          oldValue: issue.status,
          newValue: validated.data.status,
        },
      });

      // Notify reporter when issue is completed
      if (validated.data.status === "DONE") {
        await notifyIssueCompleted({
          issueId: issue.id,
          issueKey: issue.key,
          issueTitle: issue.title,
          reporterId: issue.reporterId,
          actorId: session.user.id,
          projectPath,
        });
      }
    }

    revalidatePath(projectPath);
    return { data: updated };
  } catch (error) {
    console.error("Failed to move issue:", error);
    return { error: "Failed to move issue" };
  }
}

export async function deleteIssue(issueId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const issue = await db.issue.findUnique({
    where: { id: issueId },
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

  if (!issue) {
    return { error: "Issue not found" };
  }

  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to delete this issue" };
  }

  try {
    await db.issue.delete({
      where: { id: issueId },
    });

    revalidatePath(
      `/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete issue:", error);
    return { error: "Failed to delete issue" };
  }
}
