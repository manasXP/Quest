"use client";

import { useTransition } from "react";
import Link from "next/link";
import { UserPlus, CheckCircle, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { markNotificationAsRead, deleteNotification } from "@/server/actions/notification";
import type { NotificationType, User, Issue } from "@prisma/client";

interface NotificationItemProps {
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string | null;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
    actor: Pick<User, "id" | "name" | "email" | "image"> | null;
    issue: Pick<Issue, "id" | "key" | "title"> | null;
  };
  onUpdate?: () => void;
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  ISSUE_ASSIGNED: UserPlus,
  ISSUE_STATUS_CHANGED: CheckCircle,
  COMMENT_ADDED: MessageSquare,
};

const typeColors: Record<NotificationType, string> = {
  ISSUE_ASSIGNED: "text-blue-500",
  ISSUE_STATUS_CHANGED: "text-green-500",
  COMMENT_ADDED: "text-purple-500",
};

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const [isPending, startTransition] = useTransition();
  const Icon = typeIcons[notification.type];

  const handleClick = () => {
    if (!notification.isRead) {
      startTransition(async () => {
        await markNotificationAsRead(notification.id);
        onUpdate?.();
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deleteNotification(notification.id);
      onUpdate?.();
    });
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-md transition-colors group",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20",
        notification.link && "hover:bg-slate-100 dark:hover:bg-slate-800",
        isPending && "opacity-50"
      )}
      onClick={handleClick}
    >
      <div className="relative">
        {notification.actor ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.actor.image || undefined} />
            <AvatarFallback className="text-xs">
              {notification.actor.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Icon className={cn("h-4 w-4", typeColors[notification.type])} />
          </div>
        )}
        {notification.actor && (
          <div
            className={cn(
              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center"
            )}
          >
            <Icon className={cn("h-3 w-3", typeColors[notification.type])} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground truncate">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={handleDelete}
        disabled={isPending}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
