"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/comment";
import { logActivity } from "./activity";

export async function getCommentsByIssue(issueId: string) {
  return db.comment.findMany({
    where: { issueId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(data: {
  content: string;
  issueId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createCommentSchema.safeParse(data);
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
    return { error: "You don't have access to this issue" };
  }

  try {
    const comment = await db.comment.create({
      data: {
        content: validated.data.content,
        issueId: validated.data.issueId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "COMMENT_ADDED",
      issueId: validated.data.issueId,
      actorId: session.user.id,
    });

    revalidatePath(`/workspace/${issue.project.workspace.slug}/project/${issue.project.key}`);
    return { data: comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { error: "Failed to create comment" };
  }
}

export async function updateComment(commentId: string, data: { content: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = updateCommentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      issue: {
        include: {
          project: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });

  if (!comment) {
    return { error: "Comment not found" };
  }

  // Only the author can edit their comment
  if (comment.authorId !== session.user.id) {
    return { error: "You can only edit your own comments" };
  }

  try {
    const updated = await db.comment.update({
      where: { id: commentId },
      data: { content: validated.data.content },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Log activity
    await logActivity({
      action: "COMMENT_UPDATED",
      issueId: comment.issueId,
      actorId: session.user.id,
    });

    revalidatePath(
      `/workspace/${comment.issue.project.workspace.slug}/project/${comment.issue.project.key}`
    );
    return { data: updated };
  } catch (error) {
    console.error("Failed to update comment:", error);
    return { error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      issue: {
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

  if (!comment) {
    return { error: "Comment not found" };
  }

  // Author can delete their own comment, or workspace owner/admin
  const isOwner = comment.issue.project.workspace.ownerId === session.user.id;
  const isAdmin = comment.issue.project.workspace.members.some(
    (m) => m.role === "ADMIN"
  );
  const isAuthor = comment.authorId === session.user.id;

  if (!isOwner && !isAdmin && !isAuthor) {
    return { error: "You don't have permission to delete this comment" };
  }

  try {
    await db.comment.delete({
      where: { id: commentId },
    });

    // Log activity
    await logActivity({
      action: "COMMENT_DELETED",
      issueId: comment.issueId,
      actorId: session.user.id,
    });

    revalidatePath(
      `/workspace/${comment.issue.project.workspace.slug}/project/${comment.issue.project.key}`
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { error: "Failed to delete comment" };
  }
}
