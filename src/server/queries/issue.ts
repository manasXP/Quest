import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { IssueStatus } from "@prisma/client";

export async function getIssue(issueId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      reporter: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      subtasks: {
        orderBy: { order: "asc" },
      },
      parent: true,
    },
  });

  if (!issue) return null;

  // Check access
  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.some((m) => m.userId === session.user.id);

  if (!hasAccess) return null;

  return issue;
}

export async function getIssueByKey(projectId: string, issueKey: string) {
  return db.issue.findUnique({
    where: {
      projectId_key: {
        projectId,
        key: issueKey,
      },
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      reporter: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      subtasks: {
        orderBy: { order: "asc" },
      },
      parent: true,
    },
  });
}

export async function getIssuesForBoard(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.issue.findMany({
    where: {
      projectId,
      parentId: null, // Only top-level issues
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      _count: {
        select: { subtasks: true },
      },
    },
    orderBy: [{ status: "asc" }, { order: "asc" }],
  });
}

export async function getBacklogIssues(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.issue.findMany({
    where: {
      projectId,
      parentId: null,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      reporter: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      _count: {
        select: { subtasks: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getIssuesByStatus(projectId: string, status: IssueStatus) {
  return db.issue.findMany({
    where: {
      projectId,
      status,
      parentId: null,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
    },
    orderBy: { order: "asc" },
  });
}
