"use client";

import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  User,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ActivityWithActor, ActivityAction } from "@/types";

interface ActivityItemProps {
  activity: ActivityWithActor;
}

const actionIcons: Record<ActivityAction, React.ElementType> = {
  ISSUE_CREATED: Plus,
  ISSUE_UPDATED: Pencil,
  ISSUE_DELETED: Trash2,
  ISSUE_STATUS_CHANGED: ArrowRight,
  ISSUE_ASSIGNED: User,
  ISSUE_PRIORITY_CHANGED: AlertTriangle,
  COMMENT_ADDED: MessageSquare,
  COMMENT_UPDATED: Pencil,
  COMMENT_DELETED: Trash2,
};

const actionLabels: Record<ActivityAction, string> = {
  ISSUE_CREATED: "created the issue",
  ISSUE_UPDATED: "updated the issue",
  ISSUE_DELETED: "deleted the issue",
  ISSUE_STATUS_CHANGED: "changed the status",
  ISSUE_ASSIGNED: "changed the assignee",
  ISSUE_PRIORITY_CHANGED: "changed the priority",
  COMMENT_ADDED: "added a comment",
  COMMENT_UPDATED: "edited a comment",
  COMMENT_DELETED: "deleted a comment",
};

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = actionIcons[activity.action] || Pencil;
  const label = actionLabels[activity.action] || "made a change";
  const timeAgo = formatTimeAgo(new Date(activity.createdAt));

  const metadata = activity.metadata as {
    oldValue?: string;
    newValue?: string;
    field?: string;
  } | null;

  return (
    <div className="flex gap-3 py-2">
      <div className="relative flex-shrink-0">
        <Avatar className="h-6 w-6">
          <AvatarImage src={activity.actor.image || undefined} />
          <AvatarFallback className="text-xs">
            {activity.actor.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-medium">
          {activity.actor.name || activity.actor.email}
        </span>{" "}
        <span className="text-muted-foreground">{label}</span>
        {metadata && metadata.oldValue && metadata.newValue && (
          <span className="text-muted-foreground">
            {" "}
            from{" "}
            <span className="font-medium text-foreground">
              {formatValue(metadata.oldValue)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {formatValue(metadata.newValue)}
            </span>
          </span>
        )}
        <span className="ml-2 text-xs text-muted-foreground">{timeAgo}</span>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function formatValue(value: string): string {
  // Format enum values to be more readable
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
