"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubtask } from "@/server/actions/subtask";

interface CreateSubtaskFormProps {
  parentId: string;
  onSuccess?: () => void;
}

const typeOptions = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
] as const;

export function CreateSubtaskForm({ parentId, onSuccess }: CreateSubtaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TASK" | "BUG">("TASK");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createSubtask({
        title: title.trim(),
        type,
        parentId,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setTitle("");
        setType("TASK");
        setIsOpen(false);
        onSuccess?.();
      }
    });
  };

  const handleCancel = () => {
    setTitle("");
    setType("TASK");
    setError(null);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add subtask
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
      <div className="flex gap-2">
        <Select
          value={type}
          onValueChange={(value: "TASK" | "BUG") => setType(value)}
          disabled={isPending}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1"
          disabled={isPending}
          autoFocus
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !title.trim()}
        >
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
