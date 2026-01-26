"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createInvitationSchema, respondToInvitationSchema } from "@/lib/validations/invitation";

export async function createInvitation(data: {
  email: string;
  role?: "ADMIN" | "DEVELOPER" | "TESTER" | "GUEST";
  workspaceId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = createInvitationSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Check if user is owner or admin of the workspace
  const workspace = await db.workspace.findUnique({
    where: { id: validated.data.workspaceId },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    return { error: "Workspace not found" };
  }

  const isOwner = workspace.ownerId === session.user.id;
  const isAdmin = workspace.members.some((m) => m.role === "ADMIN");

  if (!isOwner && !isAdmin) {
    return { error: "You don't have permission to invite members" };
  }

  // Check if user is already a member
  const existingMember = await db.workspaceMember.findFirst({
    where: {
      workspaceId: validated.data.workspaceId,
      user: { email: validated.data.email },
    },
  });

  if (existingMember) {
    return { error: "This user is already a member of this workspace" };
  }

  // Check if there's already a pending invitation
  const existingInvitation = await db.invitation.findFirst({
    where: {
      email: validated.data.email,
      workspaceId: validated.data.workspaceId,
      status: "PENDING",
    },
  });

  if (existingInvitation) {
    return { error: "An invitation has already been sent to this email" };
  }

  try {
    const invitation = await db.invitation.create({
      data: {
        email: validated.data.email,
        role: validated.data.role || "DEVELOPER",
        workspaceId: validated.data.workspaceId,
        invitedById: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    revalidatePath(`/workspace/${workspace.slug}/settings`);
    return { data: invitation };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return { error: "Failed to create invitation" };
  }
}

export async function respondToInvitation(data: { token: string; accept: boolean }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = respondToInvitationSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const invitation = await db.invitation.findUnique({
    where: { token: validated.data.token },
    include: { workspace: true },
  });

  if (!invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.status !== "PENDING") {
    return { error: "This invitation is no longer valid" };
  }

  if (new Date() > invitation.expiresAt) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { error: "This invitation has expired" };
  }

  // Check if the invitation email matches the current user's email
  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return { error: "This invitation was sent to a different email address" };
  }

  try {
    if (validated.data.accept) {
      // Create membership and update invitation
      await db.$transaction([
        db.workspaceMember.create({
          data: {
            userId: session.user.id,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
          },
        }),
        db.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        }),
      ]);

      return { data: { workspaceSlug: invitation.workspace.slug } };
    } else {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: "REJECTED" },
      });

      return { data: { rejected: true } };
    }
  } catch (error) {
    console.error("Failed to respond to invitation:", error);
    return { error: "Failed to respond to invitation" };
  }
}

export async function cancelInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
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

  if (!invitation) {
    return { error: "Invitation not found" };
  }

  const isOwner = invitation.workspace.ownerId === session.user.id;
  const isAdmin = invitation.workspace.members.some((m) => m.role === "ADMIN");
  const isSender = invitation.invitedById === session.user.id;

  if (!isOwner && !isAdmin && !isSender) {
    return { error: "You don't have permission to cancel this invitation" };
  }

  try {
    await db.invitation.delete({
      where: { id: invitationId },
    });

    revalidatePath(`/workspace/${invitation.workspace.slug}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel invitation:", error);
    return { error: "Failed to cancel invitation" };
  }
}

export async function removeMember(memberId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const member = await db.workspaceMember.findUnique({
    where: { id: memberId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
      user: true,
    },
  });

  if (!member) {
    return { error: "Member not found" };
  }

  // Can't remove the owner
  if (member.userId === member.workspace.ownerId) {
    return { error: "Cannot remove the workspace owner" };
  }

  const isOwner = member.workspace.ownerId === session.user.id;
  const isAdmin = member.workspace.members.some((m) => m.role === "ADMIN");

  if (!isOwner && !isAdmin) {
    return { error: "You don't have permission to remove members" };
  }

  try {
    await db.workspaceMember.delete({
      where: { id: memberId },
    });

    revalidatePath(`/workspace/${member.workspace.slug}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { error: "Failed to remove member" };
  }
}
