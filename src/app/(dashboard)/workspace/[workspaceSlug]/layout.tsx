import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceMobileMenu } from "@/components/workspace/workspace-mobile-menu";

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
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Mobile hamburger menu - rendered in header via context */}
      <WorkspaceMobileMenu workspace={workspace} />
      <WorkspaceSidebar workspace={workspace} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
