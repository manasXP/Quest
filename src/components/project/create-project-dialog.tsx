"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/server/actions/project";

interface CreateProjectDialogProps {
  workspaceId: string;
  workspaceSlug: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function generateKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "PROJ";
}

export function CreateProjectDialog({
  workspaceId,
  workspaceSlug,
  children,
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyManuallySet, setKeyManuallySet] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!keyManuallySet) {
      setKey(generateKey(value));
    }
  };

  const handleKeyChange = (value: string) => {
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setKeyManuallySet(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;

    startTransition(async () => {
      const result = await createProject({
        name,
        key,
        description: description || undefined,
        workspaceId,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setIsOpen(false);
        setName("");
        setKey("");
        setKeyManuallySet(false);
        router.push(`/workspace/${workspaceSlug}/project/${result.data.key}`);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setKey("");
      setKeyManuallySet(false);
      setError(null);
    }
    setIsOpen(open);
  };

  const content = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create project</DialogTitle>
        <DialogDescription>
          Add a new project to your workspace.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Project"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Project key</Label>
            <Input
              id="key"
              name="key"
              placeholder="PROJ"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              required
              disabled={isPending}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Used to prefix issue keys (e.g., {key || "PROJ"}-1)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your project..."
              disabled={isPending}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !name || !key}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (children) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {content}
    </Dialog>
  );
}
