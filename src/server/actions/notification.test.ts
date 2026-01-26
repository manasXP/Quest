import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  notifyIssueAssigned,
  notifyIssueCompleted,
  notifyCommentAdded,
} from "./notification";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createNotification as createNotificationFactory } from "@/test/factories/notification";

const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_ACTOR_ID = "clyg7v3qj0002actr1234abcd";
const VALID_ISSUE_ID = "clyg7v3qj0003isue1234abcd";
const VALID_NOTIFICATION_ID = "clyg7v3qj0004ntfy1234abcd";

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create notification successfully", async () => {
    const notification = createNotificationFactory({
      type: "ISSUE_ASSIGNED",
      title: "You were assigned to PROJ-1",
      userId: VALID_USER_ID,
    });

    vi.mocked(db.notification.create).mockResolvedValueOnce(notification as never);

    const result = await createNotification({
      type: "ISSUE_ASSIGNED",
      title: "You were assigned to PROJ-1",
      userId: VALID_USER_ID,
    });

    expect(result).toEqual(notification);
    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "ISSUE_ASSIGNED",
        title: "You were assigned to PROJ-1",
        userId: VALID_USER_ID,
      }),
    });
  });

  it("should NOT create notification when user notifies themselves", async () => {
    const result = await createNotification({
      type: "ISSUE_ASSIGNED",
      title: "You were assigned",
      userId: VALID_USER_ID,
      actorId: VALID_USER_ID, // Same user
    });

    expect(result).toBeNull();
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("should create notification with all optional fields", async () => {
    const notification = createNotificationFactory({
      type: "COMMENT_ADDED",
      title: "New comment on PROJ-1",
      message: "Check this out",
      link: "/workspace/test/project/PROJ/board",
      userId: VALID_USER_ID,
      actorId: VALID_ACTOR_ID,
      issueId: VALID_ISSUE_ID,
    });

    vi.mocked(db.notification.create).mockResolvedValueOnce(notification as never);

    const result = await createNotification({
      type: "COMMENT_ADDED",
      title: "New comment on PROJ-1",
      message: "Check this out",
      link: "/workspace/test/project/PROJ/board",
      userId: VALID_USER_ID,
      actorId: VALID_ACTOR_ID,
      issueId: VALID_ISSUE_ID,
    });

    expect(result).toEqual(notification);
  });

  it("should handle database error gracefully", async () => {
    vi.mocked(db.notification.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createNotification({
      type: "ISSUE_ASSIGNED",
      title: "Test",
      userId: VALID_USER_ID,
    });

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("markNotificationAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await markNotificationAsRead(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when notification not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(null);

    const result = await markNotificationAsRead(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Notification not found" });
  });

  it("should return error when notification belongs to another user", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009other1234abc" });

    const notification = createNotificationFactory({ userId: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(notification as never);

    const result = await markNotificationAsRead(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should mark notification as read", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const notification = createNotificationFactory({ userId: VALID_USER_ID, isRead: false });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(notification as never);
    vi.mocked(db.notification.update).mockResolvedValueOnce({ ...notification, isRead: true } as never);

    const result = await markNotificationAsRead(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ success: true });
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: VALID_NOTIFICATION_ID },
      data: { isRead: true },
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const notification = createNotificationFactory({ userId: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(notification as never);
    vi.mocked(db.notification.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await markNotificationAsRead(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Failed to update notification" });
    consoleSpy.mockRestore();
  });
});

describe("markAllNotificationsAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await markAllNotificationsAsRead();

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should mark all user notifications as read", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.updateMany).mockResolvedValueOnce({ count: 5 } as never);

    const result = await markAllNotificationsAsRead();

    expect(result).toEqual({ success: true });
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: VALID_USER_ID,
        isRead: false,
      },
      data: { isRead: true },
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.updateMany).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await markAllNotificationsAsRead();

    expect(result).toEqual({ error: "Failed to update notifications" });
    consoleSpy.mockRestore();
  });
});

describe("deleteNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteNotification(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when notification not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(null);

    const result = await deleteNotification(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Notification not found" });
  });

  it("should return error when notification belongs to another user", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009other1234abc" });

    const notification = createNotificationFactory({ userId: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(notification as never);

    const result = await deleteNotification(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should delete notification successfully", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const notification = createNotificationFactory({ userId: VALID_USER_ID });
    vi.mocked(db.notification.findUnique).mockResolvedValueOnce(notification as never);
    vi.mocked(db.notification.delete).mockResolvedValueOnce(notification as never);

    const result = await deleteNotification(VALID_NOTIFICATION_ID);

    expect(result).toEqual({ success: true });
    expect(db.notification.delete).toHaveBeenCalledWith({
      where: { id: VALID_NOTIFICATION_ID },
    });
  });
});

describe("getNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getNotifications();

    expect(result).toEqual([]);
  });

  it("should return notifications for user", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const notifications = [
      createNotificationFactory({ userId: VALID_USER_ID }),
      createNotificationFactory({ userId: VALID_USER_ID }),
    ];

    vi.mocked(db.notification.findMany).mockResolvedValueOnce(notifications as never);

    const result = await getNotifications();

    expect(result).toEqual(notifications);
    expect(db.notification.findMany).toHaveBeenCalledWith({
      where: { userId: VALID_USER_ID },
      include: {
        actor: {
          select: { id: true, name: true, email: true, image: true },
        },
        issue: {
          select: { id: true, key: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  });

  it("should respect custom limit", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.findMany).mockResolvedValueOnce([] as never);

    await getNotifications(50);

    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      })
    );
  });
});

describe("getUnreadNotificationCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getUnreadNotificationCount();

    expect(result).toBe(0);
  });

  it("should return count of unread notifications", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.notification.count).mockResolvedValueOnce(7);

    const result = await getUnreadNotificationCount();

    expect(result).toBe(7);
    expect(db.notification.count).toHaveBeenCalledWith({
      where: {
        userId: VALID_USER_ID,
        isRead: false,
      },
    });
  });
});

describe("notifyIssueAssigned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT create notification when assigning to self", async () => {
    await notifyIssueAssigned({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      assigneeId: VALID_USER_ID,
      actorId: VALID_USER_ID, // Same user
      projectPath: "/workspace/test/project/PROJ",
    });

    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("should create notification for assignee", async () => {
    vi.mocked(db.notification.create).mockResolvedValueOnce({} as never);

    await notifyIssueAssigned({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      assigneeId: VALID_USER_ID,
      actorId: VALID_ACTOR_ID,
      projectPath: "/workspace/test/project/PROJ",
    });

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "ISSUE_ASSIGNED",
        title: "You were assigned to PROJ-1",
        message: "Test Issue",
        userId: VALID_USER_ID,
        actorId: VALID_ACTOR_ID,
        issueId: VALID_ISSUE_ID,
      }),
    });
  });
});

describe("notifyIssueCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT create notification when completing own issue", async () => {
    await notifyIssueCompleted({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      reporterId: VALID_USER_ID,
      actorId: VALID_USER_ID, // Same user
      projectPath: "/workspace/test/project/PROJ",
    });

    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("should create notification for reporter", async () => {
    vi.mocked(db.notification.create).mockResolvedValueOnce({} as never);

    await notifyIssueCompleted({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      reporterId: VALID_USER_ID,
      actorId: VALID_ACTOR_ID,
      projectPath: "/workspace/test/project/PROJ",
    });

    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "ISSUE_STATUS_CHANGED",
        title: "PROJ-1 was marked as Done",
        userId: VALID_USER_ID,
      }),
    });
  });
});

describe("notifyCommentAdded", () => {
  const REPORTER_ID = "clyg7v3qj0005rptr1234abcd";
  const ASSIGNEE_ID = "clyg7v3qj0006asgn1234abcd";
  const COMMENT_AUTHOR_ID = "clyg7v3qj0007cmnt1234abcd";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should notify reporter and assignee but not commenter", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({} as never);

    await notifyCommentAdded({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      commentAuthorId: COMMENT_AUTHOR_ID,
      reporterId: REPORTER_ID,
      assigneeId: ASSIGNEE_ID,
      projectPath: "/workspace/test/project/PROJ",
    });

    // Should be called twice: once for reporter, once for assignee
    expect(db.notification.create).toHaveBeenCalledTimes(2);
  });

  it("should NOT notify when commenter is the reporter", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({} as never);

    await notifyCommentAdded({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      commentAuthorId: REPORTER_ID, // Commenter is reporter
      reporterId: REPORTER_ID,
      assigneeId: ASSIGNEE_ID,
      projectPath: "/workspace/test/project/PROJ",
    });

    // Should only notify assignee
    expect(db.notification.create).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: ASSIGNEE_ID,
      }),
    });
  });

  it("should NOT notify when commenter is the assignee", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({} as never);

    await notifyCommentAdded({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      commentAuthorId: ASSIGNEE_ID, // Commenter is assignee
      reporterId: REPORTER_ID,
      assigneeId: ASSIGNEE_ID,
      projectPath: "/workspace/test/project/PROJ",
    });

    // Should only notify reporter
    expect(db.notification.create).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: REPORTER_ID,
      }),
    });
  });

  it("should handle null assigneeId", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({} as never);

    await notifyCommentAdded({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      commentAuthorId: COMMENT_AUTHOR_ID,
      reporterId: REPORTER_ID,
      assigneeId: null,
      projectPath: "/workspace/test/project/PROJ",
    });

    // Should only notify reporter
    expect(db.notification.create).toHaveBeenCalledTimes(1);
    expect(db.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: REPORTER_ID,
      }),
    });
  });

  it("should only notify once when reporter and assignee are the same", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({} as never);

    await notifyCommentAdded({
      issueId: VALID_ISSUE_ID,
      issueKey: "PROJ-1",
      issueTitle: "Test Issue",
      commentAuthorId: COMMENT_AUTHOR_ID,
      reporterId: REPORTER_ID,
      assigneeId: REPORTER_ID, // Same as reporter
      projectPath: "/workspace/test/project/PROJ",
    });

    // Should only notify once (deduped)
    expect(db.notification.create).toHaveBeenCalledTimes(1);
  });
});
