"use client";

import { useTransition } from "react";
import { Bug, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { updateSubtaskStatus } from "@/server/actions/subtask";
import type { Issue, IssueType, IssuePriority } from "@prisma/client";

interface SubtaskItemProps {
  subtask: Pick<Issue, "id" | "key" | "title" | "type" | "priority" | "status">;
  onUpdate?: () => void;
}

const typeIcons: Record<"TASK" | "BUG", React.ElementType> = {
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

export function SubtaskItem({ subtask, onUpdate }: SubtaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const isDone = subtask.status === "DONE";
  const TypeIcon = typeIcons[subtask.type as "TASK" | "BUG"] || CheckSquare;

  const handleToggle = () => {
    startTransition(async () => {
      await updateSubtaskStatus({
        subtaskId: subtask.id,
        status: isDone ? "TODO" : "DONE",
      });
      onUpdate?.();
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="h-4 w-4"
      />

      <TypeIcon
        className={cn(
          "h-4 w-4 shrink-0",
          typeColors[subtask.type],
          isDone && "opacity-50"
        )}
      />

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-sm truncate block",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {subtask.title}
        </span>
      </div>

      <span className="text-xs text-muted-foreground font-mono shrink-0">
        {subtask.key}
      </span>

      <Badge
        variant="secondary"
        className={cn("text-xs shrink-0", priorityColors[subtask.priority])}
      >
        {subtask.priority.toLowerCase()}
      </Badge>
    </div>
  );
}
