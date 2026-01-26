"use client";

import { cn } from "@/lib/utils";
import type { IssueStatus } from "@prisma/client";

interface BoardColumnProps {
  id: IssueStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}

const statusColors: Record<IssueStatus, string> = {
  BACKLOG: "bg-slate-500",
  TODO: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  IN_REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-500",
};

export function BoardColumn({ id, title, count, children }: BoardColumnProps) {
  return (
    <div className="flex flex-col w-72 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2 p-3 border-b">
        <div className={cn("w-2 h-2 rounded-full", statusColors[id])} />
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
