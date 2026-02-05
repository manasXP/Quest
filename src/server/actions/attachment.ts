"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getAttachmentsByIssue(issueId: string) {
  return db.attachment.findMany({
    where: { issueId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
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

  if (!attachment) {
    return { error: "Attachment not found" };
  }

  // Permission check: uploader, workspace owner, or admin can delete
  const isUploader = attachment.uploaderId === session.user.id;
  const isOwner = attachment.issue.project.workspace.ownerId === session.user.id;
  const isAdmin = attachment.issue.project.workspace.members.some(
    (m) => m.role === "ADMIN"
  );

  if (!isUploader && !isOwner && !isAdmin) {
    return { error: "You don't have permission to delete this attachment" };
  }

  try {
    // Delete from Vercel Blob
    await del(attachment.url);

    // Delete from database
    await db.attachment.delete({
      where: { id: attachmentId },
    });

    revalidatePath(
      `/workspace/${attachment.issue.project.workspace.slug}/project/${attachment.issue.project.key}`
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return { error: "Failed to delete attachment" };
  }
}
