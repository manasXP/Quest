"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, X, Paperclip } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIssue } from "@/server/actions/issue";
import { MAX_FILE_SIZE, isAllowedFileType, formatFileSize } from "@/lib/upload";
import type { User } from "@prisma/client";

interface CreateIssueDialogProps {
  projectId: string;
  members?: Pick<User, "id" | "name" | "email" | "image">[];
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const issueTypes = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "STORY", label: "Story" },
  { value: "EPIC", label: "Epic" },
] as const;

const priorities = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
] as const;

export function CreateIssueDialog({
  projectId,
  members = [],
  children,
  open,
  onOpenChange,
  onSuccess,
}: CreateIssueDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
        continue;
      }
      if (!isAllowedFileType(file.type)) {
        toast.error(`${file.name} has unsupported file type`);
        continue;
      }
      // Check for duplicates
      if (selectedFiles.some(f => f.name === file.name)) {
        toast.error(`${file.name} is already selected`);
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const uploadAttachments = async (issueId: string) => {
    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("issueId", issueId);

      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to upload ${file.name}`);
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "EPIC" | "STORY" | "TASK" | "BUG";
    const priority = formData.get("priority") as "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
    const assigneeId = formData.get("assigneeId") as string;

    startTransition(async () => {
      const result = await createIssue({
        title,
        description: description || undefined,
        type,
        priority,
        projectId,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId || null,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          try {
            await uploadAttachments(result.data.id);
            toast.success(`Issue created with ${selectedFiles.length} attachment(s)`);
          } catch (uploadError) {
            toast.error(uploadError instanceof Error ? uploadError.message : "Some attachments failed to upload");
          }
        }
        setSelectedFiles([]);
        setIsOpen(false);
        onSuccess?.();
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setSelectedFiles([]);
    }
    setIsOpen(open);
  };

  const content = (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Create issue</DialogTitle>
        <DialogDescription>Add a new issue to the project.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Issue title"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="TASK" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assignee</Label>
            <Select name="assigneeId" defaultValue="unassigned" disabled={isPending}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the issue..."
              disabled={isPending}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.rar,.gz"
              disabled={isPending}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Add Files
              </Button>
              {selectedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                >
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({formatFileSize(file.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="ml-1 hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {selectedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} file(s) will be uploaded after issue creation
              </p>
            )}
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
          <Button type="submit" disabled={isPending}>
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
