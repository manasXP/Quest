"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  FolderKanban,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import type { Workspace, Project } from "@prisma/client";

interface WorkspaceSidebarProps {
  workspace: Workspace & { projects: Project[] };
}

export function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
  const pathname = usePathname();

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
    <div className="flex h-full w-64 flex-col border-r bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-4">
        <h2 className="text-lg font-semibold truncate">{workspace.name}</h2>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
            {workspace.projects.map((project) => (
              <Link
                key={project.id}
                href={`/workspace/${workspace.slug}/project/${project.key}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.includes(`/project/${project.key}`)
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span className="truncate">{project.name}</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            ))}
            {workspace.projects.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No projects yet
              </p>
            )}
          </nav>
        </div>
      </ScrollArea>
    </div>
  );
}
