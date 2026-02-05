"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createIssueLinkSchema } from "@/lib/validations/issue-link";
import type { LinkType } from "@prisma/client";

export async function createIssueLink(data: {
  type: LinkType;
  fromIssueId: string;
  toIssueId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createIssueLinkSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Prevent self-linking
  if (validated.data.fromIssueId === validated.data.toIssueId) {
    return { error: "Cannot link an issue to itself" };
  }

  // Check access to the from issue
  const fromIssue = await db.issue.findUnique({
    where: { id: validated.data.fromIssueId },
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

  if (!fromIssue) {
    return { error: "Source issue not found" };
  }

  const hasAccess =
    fromIssue.project.workspace.ownerId === session.user.id ||
    fromIssue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have access to this issue" };
  }

  // Check the target issue exists
  const toIssue = await db.issue.findUnique({
    where: { id: validated.data.toIssueId },
  });

  if (!toIssue) {
    return { error: "Target issue not found" };
  }

  // Check for existing link
  const existing = await db.issueLink.findUnique({
    where: {
      fromIssueId_toIssueId_type: {
        fromIssueId: validated.data.fromIssueId,
        toIssueId: validated.data.toIssueId,
        type: validated.data.type,
      },
    },
  });

  if (existing) {
    return { error: "This link already exists" };
  }

  try {
    const link = await db.issueLink.create({
      data: {
        type: validated.data.type,
        fromIssueId: validated.data.fromIssueId,
        toIssueId: validated.data.toIssueId,
      },
      include: {
        toIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            type: true,
            status: true,
          },
        },
      },
    });

    revalidatePath(`/workspace/${fromIssue.project.workspace.slug}/projects/${fromIssue.project.key}`);
    return { data: link };
  } catch (error) {
    console.error("Failed to create issue link:", error);
    return { error: "Failed to create issue link" };
  }
}

export async function deleteIssueLink(linkId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const link = await db.issueLink.findUnique({
    where: { id: linkId },
    include: {
      fromIssue: {
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
      },
    },
  });

  if (!link) {
    return { error: "Link not found" };
  }

  const hasAccess =
    link.fromIssue.project.workspace.ownerId === session.user.id ||
    link.fromIssue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return { error: "You don't have permission to delete this link" };
  }

  try {
    await db.issueLink.delete({
      where: { id: linkId },
    });

    revalidatePath(`/workspace/${link.fromIssue.project.workspace.slug}/projects/${link.fromIssue.project.key}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete issue link:", error);
    return { error: "Failed to delete issue link" };
  }
}

export async function getIssueLinks(issueId: string) {
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
    return { error: "You don't have access to this issue" };
  }

  try {
    const [linksFrom, linksTo] = await Promise.all([
      db.issueLink.findMany({
        where: { fromIssueId: issueId },
        include: {
          toIssue: {
            select: {
              id: true,
              key: true,
              title: true,
              type: true,
              status: true,
            },
          },
        },
      }),
      db.issueLink.findMany({
        where: { toIssueId: issueId },
        include: {
          fromIssue: {
            select: {
              id: true,
              key: true,
              title: true,
              type: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { data: { linksFrom, linksTo } };
  } catch (error) {
    console.error("Failed to get issue links:", error);
    return { error: "Failed to get issue links" };
  }
}
