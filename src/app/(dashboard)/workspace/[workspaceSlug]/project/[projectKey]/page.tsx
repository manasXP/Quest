import { notFound } from "next/navigation";
import { getProjectByKey } from "@/server/queries/project";
import { getIssuesForBoard } from "@/server/queries/issue";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { BoardView } from "@/components/board/board-view";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
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

  const members = workspace.members.map((m) => m.user);

  return (
    <BoardView
      project={project}
      issues={issues}
      members={members}
    />
  );
}
