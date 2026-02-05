"use client";

import { useState, useTransition } from "react";
import { ArrowRightCircle } from "lucide-react";
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
import { bulkUpdateStatus } from "@/server/actions/bulk";
import type { IssueStatus } from "@prisma/client";

interface BulkStatusDialogProps {
  selectedIds: string[];
  onSuccess?: () => void;
}

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function BulkStatusDialog({ selectedIds, onSuccess }: BulkStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!status) return;

    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateStatus({
        issueIds: selectedIds,
        status,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setStatus("");
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
          <ArrowRightCircle className="mr-1 h-4 w-4" />
          Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update the status of {selectedIds.length} issue
            {selectedIds.length > 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={status}
            onValueChange={(value: IssueStatus) => setStatus(value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
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
          <Button onClick={handleSubmit} disabled={isPending || !status}>
            {isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
