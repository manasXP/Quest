"use client";

import { useState, useTransition } from "react";
import { Bug, BookOpen, Zap, CheckSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentList } from "@/components/comment/comment-list";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { updateIssue, deleteIssue } from "@/server/actions/issue";
import type { Issue, User, IssueType, IssueStatus, IssuePriority } from "@prisma/client";

interface IssueDetailPanelProps {
  issue:
    | (Issue & {
        assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
        reporter: Pick<User, "id" | "name" | "email" | "image">;
        labels: { label: { id: string; name: string; color: string } }[];
      })
    | null;
  members: Pick<User, "id" | "name" | "email" | "image">[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

const typeIcons: Record<IssueType, React.ElementType> = {
  EPIC: Zap,
  STORY: BookOpen,
  TASK: CheckSquare,
  BUG: Bug,
};

const typeColors: Record<IssueType, string> = {
  EPIC: "text-purple-600",
  STORY: "text-green-600",
  TASK: "text-blue-600",
  BUG: "text-red-600",
};

const statuses: { value: IssueStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const priorities: { value: IssuePriority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
];

const types: { value: IssueType; label: string }[] = [
  { value: "EPIC", label: "Epic" },
  { value: "STORY", label: "Story" },
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
];

export function IssueDetailPanel({
  issue,
  members,
  currentUserId,
  open,
  onOpenChange,
  onUpdate,
}: IssueDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(issue?.title || "");
  const [description, setDescription] = useState(issue?.description || "");

  if (!issue) return null;

  const TypeIcon = typeIcons[issue.type];

  const handleUpdate = (data: Parameters<typeof updateIssue>[1]) => {
    startTransition(async () => {
      await updateIssue(issue.id, data);
      onUpdate?.();
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    startTransition(async () => {
      await deleteIssue(issue.id);
      onOpenChange(false);
      onUpdate?.();
    });
  };

  const handleTitleBlur = () => {
    if (title !== issue.title && title.trim()) {
      handleUpdate({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== issue.description) {
      handleUpdate({ description: description || null });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TypeIcon className={cn("h-4 w-4", typeColors[issue.type])} />
            <span className="font-mono">{issue.key}</span>
          </div>
          <SheetTitle className="sr-only">{issue.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isPending}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={issue.status}
                onValueChange={(value: IssueStatus) => handleUpdate({ status: value })}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={issue.priority}
                onValueChange={(value: IssuePriority) => handleUpdate({ priority: value })}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={issue.type}
                onValueChange={(value: IssueType) => handleUpdate({ type: value })}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select
                value={issue.assigneeId || "unassigned"}
                onValueChange={(value) =>
                  handleUpdate({ assigneeId: value === "unassigned" ? null : value })
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
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
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description..."
              rows={4}
              disabled={isPending}
            />
          </div>

          <Separator />

          <Tabs defaultValue="comments" className="w-full">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
              <CommentList issueId={issue.id} currentUserId={currentUserId} />
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <ActivityFeed issueId={issue.id} />
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reporter</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={issue.reporter.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {issue.reporter.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {issue.reporter.name || issue.reporter.email}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                {new Date(issue.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Updated</span>
              <span className="text-sm">
                {new Date(issue.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Issue
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
