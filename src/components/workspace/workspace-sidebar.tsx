"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  FolderKanban,
  Plus,
  ChevronRight,
  Loader2,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import type { Workspace, Project } from "@prisma/client";

interface WorkspaceSidebarProps {
  workspace: Workspace & { projects: Project[] };
}

// Extracted sidebar content for reuse
function SidebarContent({
  workspace,
  onNavigate,
}: {
  workspace: Workspace & { projects: Project[] };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingProjectKey, setLoadingProjectKey] = React.useState<string | null>(null);

  const handleProjectClick = (e: React.MouseEvent, projectKey: string, href: string) => {
    e.preventDefault();
    setLoadingProjectKey(projectKey);
    startTransition(() => {
      router.push(href);
      onNavigate?.();
    });
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
      onNavigate?.();
    });
  };

  // Reset loading state when navigation completes
  React.useEffect(() => {
    if (!isPending) {
      setLoadingProjectKey(null);
    }
  }, [isPending]);

  const navItems = [
    {
      label: "Overview",
      href: `/workspace/${workspace.slug}`,
      icon: Home,
    },
    {
      label: "Settings",
      href: `/workspace/${workspace.slug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Projects
            </span>
            <CreateProjectDialog workspaceId={workspace.id} workspaceSlug={workspace.slug}>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </CreateProjectDialog>
          </div>
          <nav className="space-y-1">
            {workspace.projects.map((project) => {
              const href = `/workspace/${workspace.slug}/project/${project.key}`;
              const isLoading = loadingProjectKey === project.key && isPending;
              const isActive = pathname.includes(`/project/${project.key}`);

              return (
                <Link
                  key={project.id}
                  href={href}
                  onClick={(e) => handleProjectClick(e, project.key, href)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                    isLoading && "opacity-70"
                  )}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span className="truncate">{project.name}</span>
                  {isLoading ? (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </Link>
              );
            })}
            {workspace.projects.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No projects yet
              </p>
            )}
          </nav>
        </div>
      </ScrollArea>
    </>
  );
}

// Mobile sidebar trigger button
export function MobileSidebarTrigger({
  workspace,
}: {
  workspace: Workspace & { projects: Project[] };
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="truncate">{workspace.name}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <SidebarContent workspace={workspace} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar (hidden on mobile)
export function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-4">
        <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
      </div>
      <Separator />
      <SidebarContent workspace={workspace} />
    </div>
  );
}
