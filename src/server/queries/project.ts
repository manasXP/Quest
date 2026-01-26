import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            select: { userId: true },
          },
        },
      },
      lead: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: true,
      _count: {
        select: { issues: true },
      },
    },
  });

  if (!project) return null;

  // Check access
  const hasAccess =
    project.workspace.ownerId === session.user.id ||
    project.workspace.members.some((m) => m.userId === session.user.id);

  if (!hasAccess) return null;

  return project;
}

export async function getProjectByKey(workspaceSlug: string, projectKey: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await db.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });

  if (!workspace) return null;

  const hasAccess =
    workspace.ownerId === session.user.id ||
    workspace.members.some((m) => m.userId === session.user.id);

  if (!hasAccess) return null;

  return db.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId: workspace.id,
        key: projectKey,
      },
    },
    include: {
      lead: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: true,
    },
  });
}

export async function getProjectsInWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.project.findMany({
    where: { workspaceId },
    include: {
      lead: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { issues: true },
      },
    },
    orderBy: { name: "asc" },
  });
}
