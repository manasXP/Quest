import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { getProjectsInWorkspace } from "@/server/queries/project";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/project/project-list";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  const projects = await getProjectsInWorkspace(workspace.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateProjectDialog workspaceId={workspace.id} workspaceSlug={workspace.slug}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CreateProjectDialog>
      </div>

      <ProjectList projects={projects} workspaceSlug={workspace.slug} />
    </div>
  );
}
