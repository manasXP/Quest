import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/server/queries/project";
import { getBacklogIssues } from "@/server/queries/issue";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { getProjectSprints } from "@/server/queries/sprint";
import { Button } from "@/components/ui/button";
import { BacklogView } from "@/components/backlog/backlog-view";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";

export default async function ProjectBacklogPage({
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

  const [issues, sprints] = await Promise.all([
    getBacklogIssues(project.id),
    getProjectSprints(project.id),
  ]);
  const members = workspace.members.map((m: { user: { id: string; name: string | null; email: string; image: string | null } }) => m.user);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name} - Backlog</h1>
          <p className="text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateIssueDialog
          projectId={project.id}
          members={members}
          labels={project.labels}
          sprints={sprints}
          issues={issues.map((i) => ({
            id: i.id,
            key: i.key,
            title: i.title,
            type: i.type,
          }))}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Issue
          </Button>
        </CreateIssueDialog>
      </div>

      <BacklogView
        projectId={project.id}
        issues={issues}
        members={members}
        currentUserId={session.user.id}
      />
    </div>
  );
}
