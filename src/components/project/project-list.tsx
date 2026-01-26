"use client";

import Link from "next/link";
import { FolderKanban, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Project, User } from "@prisma/client";

interface ProjectWithDetails extends Project {
  lead: Pick<User, "id" | "name" | "email" | "image"> | null;
  _count: {
    issues: number;
  };
}

interface ProjectListProps {
  projects: ProjectWithDetails[];
  workspaceSlug: string;
}

export function ProjectList({ projects, workspaceSlug }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          No projects yet
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create your first project to start tracking issues.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/workspace/${workspaceSlug}/project/${project.key}`}
        >
          <Card className="hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold truncate">
                {project.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/workspace/${workspaceSlug}/project/${project.key}/settings`}
                    >
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span className="font-mono">{project.key}</span>
                <span>{project._count.issues} issues</span>
              </div>
              {project.lead && (
                <div className="mt-3 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.lead.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {project.lead.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {project.lead.name || project.lead.email}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
