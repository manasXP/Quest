"use client";

import { useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkStatusDialog } from "./bulk-status-dialog";
import { BulkAssignDialog } from "./bulk-assign-dialog";
import { BulkPriorityDialog } from "./bulk-priority-dialog";
import { bulkDelete } from "@/server/actions/bulk";
import type { User } from "@prisma/client";

interface BulkActionBarProps {
  selectedIds: string[];
  selectedCount: number;
  onClear: () => void;
  onSuccess?: () => void;
  members: Pick<User, "id" | "name" | "email" | "image">[];
}

export function BulkActionBar({
  selectedIds,
  selectedCount,
  onClear,
  onSuccess,
  members,
}: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition();

  if (selectedCount === 0) {
    return null;
  }

  const handleDelete = () => {
    if (!confirm(`Delete ${selectedCount} issue${selectedCount > 1 ? "s" : ""}?`)) {
      return;
    }

    startTransition(async () => {
      const result = await bulkDelete({ issueIds: selectedIds });
      if ("success" in result && result.success) {
        onClear();
        onSuccess?.();
      }
    });
  };

  const handleSuccess = () => {
    onClear();
    onSuccess?.();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg shadow-lg">
        <span className="text-sm font-medium mr-2">
          {selectedCount} selected
        </span>

        <BulkStatusDialog
          selectedIds={selectedIds}
          onSuccess={handleSuccess}
        />

        <BulkAssignDialog
          selectedIds={selectedIds}
          members={members}
          onSuccess={handleSuccess}
        />

        <BulkPriorityDialog
          selectedIds={selectedIds}
          onSuccess={handleSuccess}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-slate-700 dark:bg-slate-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isPending}
          className="text-slate-400 hover:text-white dark:text-slate-600 dark:hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
