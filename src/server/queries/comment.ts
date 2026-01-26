import { db } from "@/lib/db";

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

export async function getCommentById(commentId: string) {
  return db.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      issue: {
        include: {
          project: {
            include: {
              workspace: {
                include: {
                  members: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
