import { notFound } from "next/navigation";
import { getProjectByKey } from "@/server/queries/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;

  const project = await getProjectByKey(workspaceSlug, projectKey);
  if (!project) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">
          Manage your project settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Basic information about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project name</label>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Project key</label>
              <p className="text-sm text-muted-foreground font-mono">{project.key}</p>
            </div>
            {project.description && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {project.lead && (
          <Card>
            <CardHeader>
              <CardTitle>Project Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={project.lead.image || undefined} />
                  <AvatarFallback>
                    {project.lead.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {project.lead.name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.lead.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
