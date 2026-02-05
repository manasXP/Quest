import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getProjectSprints(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const project = await db.project.findUnique({
    where: { id: projectId },
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

  if (!project) return [];

  const hasAccess =
    project.workspace.ownerId === session.user.id ||
    project.workspace.members.length > 0;

  if (!hasAccess) return [];

  return db.sprint.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      goal: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  });
}
