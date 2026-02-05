"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./notification-item";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/server/actions/notification";
import type { NotificationType, User, Issue } from "@prisma/client";

type NotificationData = {
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

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    const [notifs, count] = await Promise.all([
      getNotifications(10),
      getUnreadNotificationCount(),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching
      fetchData();
    }
  }, [open, fetchData]);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      fetchData();
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <span className="animate-pulse">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full">
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
