import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  return (
    <WorkspaceProvider workspace={workspace}>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <WorkspaceSidebar workspace={workspace} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
