"use client";

import { Bug, BookOpen, Zap, CheckSquare, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Issue, User, IssueType, IssuePriority } from "@prisma/client";

interface IssueCardProps {
  issue: Issue & {
    assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
    labels: { label: { id: string; name: string; color: string } }[];
    _count?: { subtasks: number };
  };
  onClick?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
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

export function IssueCard({ issue, onClick, isDragging, isSelected }: IssueCardProps) {
  const TypeIcon = typeIcons[issue.type];

  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "ring-2 ring-blue-500 border-blue-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <TypeIcon className={cn("h-4 w-4 mt-0.5 shrink-0", typeColors[issue.type])} />
          <span className="text-sm font-medium line-clamp-2">{issue.title}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {issue.key}
            </span>
            {issue._count && issue._count.subtasks > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListTodo className="h-3 w-3" />
                {issue._count.subtasks}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", priorityColors[issue.priority])}>
              {issue.priority.toLowerCase()}
            </Badge>
            {issue.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={issue.assignee.image || undefined} />
                <AvatarFallback className="text-xs">
                  {issue.assignee.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>

        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.labels.slice(0, 3).map(({ label }) => (
              <span
                key={label.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${label.color}20`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
            {issue.labels.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{issue.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
