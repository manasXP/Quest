import { db } from "@/lib/db";

export async function getInvitationByToken(token: string) {
  return db.invitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

export async function getPendingInvitations(workspaceId: string) {
  return db.invitation.findMany({
    where: {
      workspaceId,
      status: "PENDING",
    },
    include: {
      invitedBy: {
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
