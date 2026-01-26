"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkUpdatePriority } from "@/server/actions/bulk";
import type { IssuePriority } from "@prisma/client";

interface BulkPriorityDialogProps {
  selectedIds: string[];
  onSuccess?: () => void;
}

const priorityOptions: { value: IssuePriority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
];

export function BulkPriorityDialog({ selectedIds, onSuccess }: BulkPriorityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<IssuePriority | "">("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!priority) return;

    setError(null);
    startTransition(async () => {
      const result = await bulkUpdatePriority({
        issueIds: selectedIds,
        priority,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setPriority("");
        setOpen(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white dark:text-slate-700 dark:hover:text-slate-900"
        >
          <Flag className="mr-1 h-4 w-4" />
          Priority
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Priority</DialogTitle>
          <DialogDescription>
            Update the priority of {selectedIds.length} issue
            {selectedIds.length > 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={priority}
            onValueChange={(value: IssuePriority) => setPriority(value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !priority}>
            {isPending ? "Updating..." : "Update Priority"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
