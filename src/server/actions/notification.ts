"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  userId: string;
  actorId?: string;
  issueId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  // Don't create notification if user is notifying themselves
  if (params.actorId && params.actorId === params.userId) {
    return null;
  }

  try {
    const notification = await db.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        userId: params.userId,
        actorId: params.actorId,
        issueId: params.issueId,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return { error: "Notification not found" };
  }

  if (notification.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { error: "Failed to update notification" };
  }
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { error: "Failed to update notifications" };
  }
}

export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return { error: "Notification not found" };
  }

  if (notification.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  try {
    await db.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return { error: "Failed to delete notification" };
  }
}

export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.notification.findMany({
    where: { userId: session.user.id },
    include: {
      actor: {
        select: { id: true, name: true, email: true, image: true },
      },
      issue: {
        select: { id: true, key: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return db.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });
}

// Helper function to notify on issue assignment
export async function notifyIssueAssigned({
  issueId,
  issueKey,
  issueTitle,
  assigneeId,
  actorId,
  projectPath,
}: {
  issueId: string;
  issueKey: string;
  issueTitle: string;
  assigneeId: string;
  actorId: string;
  projectPath: string;
}) {
  if (assigneeId === actorId) return; // Don't notify self

  await createNotification({
    type: "ISSUE_ASSIGNED",
    title: `You were assigned to ${issueKey}`,
    message: issueTitle,
    link: `${projectPath}/board`,
    userId: assigneeId,
    actorId,
    issueId,
  });
}

// Helper function to notify on issue status change to DONE
export async function notifyIssueCompleted({
  issueId,
  issueKey,
  issueTitle,
  reporterId,
  actorId,
  projectPath,
}: {
  issueId: string;
  issueKey: string;
  issueTitle: string;
  reporterId: string;
  actorId: string;
  projectPath: string;
}) {
  if (reporterId === actorId) return; // Don't notify self

  await createNotification({
    type: "ISSUE_STATUS_CHANGED",
    title: `${issueKey} was marked as Done`,
    message: issueTitle,
    link: `${projectPath}/board`,
    userId: reporterId,
    actorId,
    issueId,
  });
}

// Helper function to notify on new comment
export async function notifyCommentAdded({
  issueId,
  issueKey,
  issueTitle,
  commentAuthorId,
  reporterId,
  assigneeId,
  projectPath,
}: {
  issueId: string;
  issueKey: string;
  issueTitle: string;
  commentAuthorId: string;
  reporterId: string;
  assigneeId: string | null;
  projectPath: string;
}) {
  const recipientIds = new Set<string>();

  // Add reporter if not the commenter
  if (reporterId !== commentAuthorId) {
    recipientIds.add(reporterId);
  }

  // Add assignee if exists and not the commenter
  if (assigneeId && assigneeId !== commentAuthorId) {
    recipientIds.add(assigneeId);
  }

  // Create notifications for each recipient
  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      createNotification({
        type: "COMMENT_ADDED",
        title: `New comment on ${issueKey}`,
        message: issueTitle,
        link: `${projectPath}/board`,
        userId,
        actorId: commentAuthorId,
        issueId,
      })
    )
  );
}
