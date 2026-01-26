import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { getPendingInvitations } from "@/server/queries/invitation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { PendingInvitations } from "@/components/workspace/pending-invitations";
import { MembersList } from "@/components/workspace/members-list";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  const pendingInvitations = await getPendingInvitations(workspace.id);

  const isOwner = workspace.ownerId === session.user.id;
  const isAdmin = workspace.members.some(
    (m: { userId: string; role: string }) =>
      m.userId === session.user.id && m.role === "ADMIN"
  );
  const isOwnerOrAdmin = isOwner || isAdmin;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings and members
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Basic information about your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace name</label>
              <p className="text-sm text-muted-foreground">{workspace.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Workspace URL</label>
              <p className="text-sm text-muted-foreground font-mono">
                /workspace/{workspace.slug}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                People who have access to this workspace
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <InviteMemberDialog workspaceId={workspace.id} />
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isOwnerOrAdmin && pendingInvitations.length > 0 && (
              <PendingInvitations invitations={pendingInvitations} />
            )}

            <MembersList
              members={workspace.members}
              owner={workspace.owner}
              currentUserId={session.user.id}
              isOwnerOrAdmin={isOwnerOrAdmin}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
