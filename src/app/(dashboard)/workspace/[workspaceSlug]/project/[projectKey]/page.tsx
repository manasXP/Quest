import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/server/queries/project";
import { getIssuesForBoard } from "@/server/queries/issue";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { BoardView } from "@/components/board/board-view";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceSlug, projectKey } = await params;

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    notFound();
  }

  const project = await getProjectByKey(workspaceSlug, projectKey);
  if (!project) {
    notFound();
  }

  const issues = await getIssuesForBoard(project.id);

  const members = workspace.members.map((m: { user: { id: string; name: string | null; email: string; image: string | null } }) => m.user);

  return (
    <BoardView
      project={project}
      issues={issues}
      members={members}
      currentUserId={session.user.id}
    />
  );
}
