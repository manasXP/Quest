let notificationCounter = 0;

export function createNotification(overrides: Partial<{
  id: string;
  type: "ISSUE_ASSIGNED" | "ISSUE_STATUS_CHANGED" | "COMMENT_ADDED";
  title: string;
  message: string | null;
  link: string | null;
  userId: string;
  actorId: string | null;
  issueId: string | null;
  isRead: boolean;
  createdAt: Date;
  actor?: { id: string; name: string; email: string; image: string | null } | null;
  issue?: { id: string; key: string; title: string } | null;
}> = {}) {
  notificationCounter++;
  return {
    id: `cuid-notification-${notificationCounter}`,
    type: "ISSUE_ASSIGNED" as const,
    title: `Test Notification ${notificationCounter}`,
    message: null,
    link: null,
    userId: `cuid-user-${notificationCounter}`,
    actorId: null,
    issueId: null,
    isRead: false,
    createdAt: new Date(),
    actor: null,
    issue: null,
    ...overrides,
  };
}

export function resetNotificationCounter() {
  notificationCounter = 0;
}
