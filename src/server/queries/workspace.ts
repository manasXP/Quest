import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { projects: true, members: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getWorkspaceBySlug(slug: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await db.workspace.findUnique({
    where: { slug },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      projects: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!workspace) return null;

  // Check if user has access
  const hasAccess =
    workspace.ownerId === session.user.id ||
    workspace.members.some((m) => m.userId === session.user.id);

  if (!hasAccess) return null;

  return workspace;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
