"use client";

import { useState, useTransition, useRef } from "react";
import { X, Paperclip, Flag, ChevronDown, ChevronUp } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DatePicker } from "@/components/ui/date-picker";
import { LabelSelector } from "@/components/label";
import { SprintSelector } from "@/components/sprint";
import { ParentIssueSelector } from "@/components/issue/parent-issue-selector";
import { IssueLinkSelector } from "@/components/issue/issue-link-selector";
import { createIssue } from "@/server/actions/issue";
import { createIssueLink } from "@/server/actions/issue-link";
import { MAX_FILE_SIZE, isAllowedFileType, formatFileSize } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { User, IssueType, IssueStatus, SprintStatus, LinkType } from "@prisma/client";

interface CreateIssueDialogProps {
  projectId: string;
  members?: Pick<User, "id" | "name" | "email" | "image">[];
  labels?: { id: string; name: string; color: string }[];
  sprints?: { id: string; name: string; status: SprintStatus }[];
  issues?: { id: string; key: string; title: string; type: IssueType }[];
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

const issueStatuses = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
] as const;

const priorities = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
] as const;

const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];

interface FormState {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  assigneeId: string | null;
  sprintId: string | null;
  parentId: string | null;
  labelIds: string[];
  startDate: Date | null;
  dueDate: Date | null;
  storyPoints: number | null;
  flagged: boolean;
  links: { type: LinkType; issueId: string }[];
}

const initialFormState: FormState = {
  title: "",
  description: "",
  type: "TASK",
  status: "BACKLOG",
  priority: "MEDIUM",
  assigneeId: null,
  sprintId: null,
  parentId: null,
  labelIds: [],
  startDate: null,
  dueDate: null,
  storyPoints: null,
  flagged: false,
  links: [],
};

export function CreateIssueDialog({
  projectId,
  members = [],
  labels = [],
  sprints = [],
  issues = [],
  children,
  open,
  onOpenChange,
  onSuccess,
}: CreateIssueDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createAnother, setCreateAnother] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      if (selectedFiles.some((f) => f.name === file.name)) {
        toast.error(`${file.name} is already selected`);
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
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

  const createLinks = async (issueId: string) => {
    const linkPromises = form.links.map((link) =>
      createIssueLink({
        type: link.type,
        fromIssueId: issueId,
        toIssueId: link.issueId,
      })
    );

    await Promise.all(linkPromises);
  };

  const resetForm = (keepPersistent = false) => {
    if (keepPersistent) {
      // Keep: project, type, priority, sprint, assignee
      setForm((prev) => ({
        ...initialFormState,
        type: prev.type,
        priority: prev.priority,
        sprintId: prev.sprintId,
        assigneeId: prev.assigneeId,
      }));
    } else {
      setForm(initialFormState);
    }
    setSelectedFiles([]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    startTransition(async () => {
      const result = await createIssue({
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        status: form.status,
        priority: form.priority,
        projectId,
        assigneeId: form.assigneeId,
        sprintId: form.sprintId,
        parentId: form.parentId,
        labelIds: form.labelIds.length > 0 ? form.labelIds : undefined,
        startDate: form.startDate,
        dueDate: form.dueDate,
        storyPoints: form.storyPoints,
        flagged: form.flagged,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        let hasWarnings = false;

        // Upload attachments if any
        if (selectedFiles.length > 0) {
          try {
            await uploadAttachments(result.data.id);
          } catch (uploadError) {
            hasWarnings = true;
            toast.error(
              uploadError instanceof Error
                ? uploadError.message
                : "Some attachments failed to upload"
            );
          }
        }

        // Create issue links if any
        if (form.links.length > 0) {
          try {
            await createLinks(result.data.id);
          } catch (linkError) {
            hasWarnings = true;
            toast.error("Some issue links failed to create");
          }
        }

        if (!hasWarnings) {
          const attachmentCount = selectedFiles.length;
          const linkCount = form.links.length;
          let message = "Issue created";
          if (attachmentCount > 0 || linkCount > 0) {
            const parts = [];
            if (attachmentCount > 0) parts.push(`${attachmentCount} attachment(s)`);
            if (linkCount > 0) parts.push(`${linkCount} link(s)`);
            message += ` with ${parts.join(" and ")}`;
          }
          toast.success(message);
        }

        if (createAnother) {
          resetForm(true);
        } else {
          resetForm();
          setIsOpen(false);
        }
        onSuccess?.();
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      setShowAdvanced(false);
      setCreateAnother(false);
    }
    setIsOpen(open);
  };

  const content = (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create issue</DialogTitle>
        <DialogDescription>Add a new issue to the project.</DialogDescription>
      </DialogHeader>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="space-y-6 py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Core Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Issue title"
                required
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => updateForm("type", v as IssueType)}
                  disabled={isPending}
                >
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => updateForm("status", v as IssueStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {issueStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={form.description}
                onChange={(v) => updateForm("description", v)}
                placeholder="Describe the issue..."
                disabled={isPending}
              />
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select
                  value={form.assigneeId || "unassigned"}
                  onValueChange={(v) =>
                    updateForm("assigneeId", v === "unassigned" ? null : v)
                  }
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    updateForm("priority", v as FormState["priority"])
                  }
                  disabled={isPending}
                >
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
          </div>

          {/* Planning Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Planning</h3>
            <div className="grid grid-cols-2 gap-4">
              {sprints.length > 0 && (
                <div className="space-y-2">
                  <Label>Sprint</Label>
                  <SprintSelector
                    sprints={sprints}
                    value={form.sprintId}
                    onChange={(v) => updateForm("sprintId", v)}
                    disabled={isPending}
                    placeholder="Select sprint..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Story Points</Label>
                <Select
                  value={form.storyPoints?.toString() || "none"}
                  onValueChange={(v) =>
                    updateForm("storyPoints", v === "none" ? null : parseInt(v))
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select points" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {storyPointOptions.map((points) => (
                      <SelectItem key={points} value={points.toString()}>
                        {points}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {labels.length > 0 && (
              <div className="space-y-2">
                <Label>Labels</Label>
                <LabelSelector
                  labels={labels}
                  selectedIds={form.labelIds}
                  onChange={(ids) => updateForm("labelIds", ids)}
                  disabled={isPending}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="flagged"
                checked={form.flagged}
                onCheckedChange={(checked) =>
                  updateForm("flagged", checked === true)
                }
                disabled={isPending}
              />
              <Label
                htmlFor="flagged"
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer",
                  form.flagged && "text-orange-600"
                )}
              >
                <Flag
                  className={cn("h-4 w-4", form.flagged && "fill-orange-600")}
                />
                Flag this issue
              </Label>
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => updateForm("startDate", v)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker
                  value={form.dueDate}
                  onChange={(v) => updateForm("dueDate", v)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <Label>Attachments</Label>
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
          </div>

          {/* Advanced Section (Collapsible) */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span>Relationships</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {issues.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Parent Issue</Label>
                    <ParentIssueSelector
                      issues={issues}
                      value={form.parentId}
                      onChange={(v) => updateForm("parentId", v)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Linked Issues</Label>
                    <IssueLinkSelector
                      issues={issues}
                      links={form.links}
                      onChange={(v) => updateForm("links", v)}
                      disabled={isPending}
                    />
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <Checkbox
              id="createAnother"
              checked={createAnother}
              onCheckedChange={(checked) => setCreateAnother(checked === true)}
              disabled={isPending}
            />
            <Label htmlFor="createAnother" className="text-sm cursor-pointer">
              Create another
            </Label>
          </div>
          <div className="flex gap-2">
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
          </div>
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
