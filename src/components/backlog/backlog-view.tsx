"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, BookOpen, Zap, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IssueDetailPanel } from "@/components/issue/issue-detail-panel";
import { IssueFilters } from "@/components/filters/issue-filters";
import { useIssueFilters } from "@/hooks/use-issue-filters";
import type { Issue, User, IssueType, IssuePriority, IssueStatus } from "@prisma/client";

type IssueWithRelations = Issue & {
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  reporter: Pick<User, "id" | "name" | "email" | "image">;
  labels: { label: { id: string; name: string; color: string } }[];
  _count: { subtasks: number };
};

interface BacklogViewProps {
  issues: IssueWithRelations[];
  members: Pick<User, "id" | "name" | "email" | "image">[];
  currentUserId: string;
}

const typeIcons: Record<IssueType, React.ElementType> = {
  EPIC: Zap,
  STORY: BookOpen,
  TASK: CheckSquare,
  BUG: Bug,
};

const typeColors: Record<IssueType, string> = {
  EPIC: "text-purple-600",
  STORY: "text-green-600",
  TASK: "text-blue-600",
  BUG: "text-red-600",
};

const priorityColors: Record<IssuePriority, string> = {
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NONE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const statusLabels: Record<IssueStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export function BacklogView({ issues, members, currentUserId }: BacklogViewProps) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<IssueWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    filters,
    filteredIssues,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useIssueFilters({
    issues,
    getIssue: (issue) => issue,
  });

  const handleRowClick = (issue: IssueWithRelations) => {
    setSelectedIssue(issue);
    setDetailOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          No issues yet
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Create your first issue to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <IssueFilters
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          members={members}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Type</TableHead>
              <TableHead className="w-[100px]">Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead className="w-[140px]">Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIssues.map((issue) => {
              const TypeIcon = typeIcons[issue.type];
              return (
                <TableRow
                  key={issue.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(issue)}
                >
                  <TableCell>
                    <TypeIcon
                      className={cn("h-4 w-4", typeColors[issue.type])}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {issue.key}
                  </TableCell>
                  <TableCell className="font-medium">{issue.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[issue.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", priorityColors[issue.priority])}
                    >
                      {issue.priority.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.assignee.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {issue.assignee.name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">
                          {issue.assignee.name || issue.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <IssueDetailPanel
        issue={selectedIssue}
        members={members}
        currentUserId={currentUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleRefresh}
      />
    </>
  );
}
