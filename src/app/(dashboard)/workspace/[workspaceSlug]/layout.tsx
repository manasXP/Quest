import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/server/queries/workspace";
import { WorkspaceSidebar, MobileSidebarTrigger } from "@/components/workspace/workspace-sidebar";

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
      {/* Mobile hamburger menu - positioned in header area */}
      <div className="fixed top-0 left-0 h-14 flex items-center px-4 z-50 md:hidden">
        <MobileSidebarTrigger workspace={workspace} />
      </div>
      <WorkspaceSidebar workspace={workspace} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
