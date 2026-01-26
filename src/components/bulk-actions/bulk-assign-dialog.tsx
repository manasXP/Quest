"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
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
import { bulkAssign } from "@/server/actions/bulk";
import type { User } from "@prisma/client";

interface BulkAssignDialogProps {
  selectedIds: string[];
  members: Pick<User, "id" | "name" | "email" | "image">[];
  onSuccess?: () => void;
}

export function BulkAssignDialog({
  selectedIds,
  members,
  onSuccess,
}: BulkAssignDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await bulkAssign({
        issueIds: selectedIds,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId || null,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setAssigneeId("");
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
          <UserPlus className="mr-1 h-4 w-4" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Issues</DialogTitle>
          <DialogDescription>
            Assign {selectedIds.length} issue{selectedIds.length > 1 ? "s" : ""} to
            a team member.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={assigneeId}
            onValueChange={setAssigneeId}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name || member.email}
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
          <Button onClick={handleSubmit} disabled={isPending || !assigneeId}>
            {isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
