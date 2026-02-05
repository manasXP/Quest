"use client";

import { useEffect, useState, useCallback } from "react";
import { ListTodo } from "lucide-react";
import { SubtaskItem } from "./subtask-item";
import { CreateSubtaskForm } from "./create-subtask-form";
import { getSubtasksByParent } from "@/server/actions/subtask";
import type { Issue } from "@prisma/client";

interface SubtaskListProps {
  parentId: string;
  parentType: string;
}

type SubtaskData = Pick<Issue, "id" | "key" | "title" | "type" | "priority" | "status">;

export function SubtaskList({ parentId, parentType }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubtasks = useCallback(async () => {
    const result = await getSubtasksByParent(parentId);
    setSubtasks(result);
    setLoading(false);
  }, [parentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Don't allow subtasks on subtasks (parentType would be from a subtask issue)
  // Also EPIC and STORY are for grouping, so we show subtasks for TASK and BUG only at the detail level
  const canHaveSubtasks = parentType === "EPIC" || parentType === "STORY" || parentType === "TASK";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="animate-pulse">Loading subtasks...</div>
      </div>
    );
  }

  const completedCount = subtasks.filter((s) => s.status === "DONE").length;
  const totalCount = subtasks.length;

  return (
    <div className="space-y-4">
      {totalCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>
            {completedCount} of {totalCount} completed
          </span>
          {totalCount > 0 && (
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {subtasks.length > 0 ? (
        <div className="space-y-1 border rounded-md divide-y">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onUpdate={fetchSubtasks}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <ListTodo className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No subtasks yet</p>
        </div>
      )}

      {canHaveSubtasks && (
        <CreateSubtaskForm parentId={parentId} onSuccess={fetchSubtasks} />
      )}
    </div>
  );
}
