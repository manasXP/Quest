import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getWorkspaces } from "@/server/queries/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";

export default async function WorkspacesPage() {
  const workspaces = await getWorkspaces();

  // If user has workspaces, redirect to the first one
  if (workspaces.length > 0) {
    redirect(`/workspace/${workspaces[0].slug}`);
  }

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Create a workspace to get started
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Quest</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Create your first workspace to start managing projects and tasks.
            </p>
            <CreateWorkspaceDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </CreateWorkspaceDialog>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
