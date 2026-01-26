import { describe, it, expect, vi, beforeEach } from "vitest";
import { logActivity, getActivitiesByIssue } from "./activity";
import { db } from "@/lib/db";

describe("logActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an activity record with metadata", async () => {
    vi.mocked(db.activity.create).mockResolvedValueOnce({
      id: "activity-1",
      action: "ISSUE_STATUS_CHANGED",
      issueId: "issue-1",
      actorId: "user-1",
      metadata: { field: "status", oldValue: "TODO", newValue: "IN_PROGRESS" },
      createdAt: new Date(),
    } as never);

    await logActivity({
      action: "ISSUE_STATUS_CHANGED",
      issueId: "issue-1",
      actorId: "user-1",
      metadata: {
        field: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
      },
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        action: "ISSUE_STATUS_CHANGED",
        issueId: "issue-1",
        actorId: "user-1",
        metadata: {
          field: "status",
          oldValue: "TODO",
          newValue: "IN_PROGRESS",
        },
      },
    });
  });

  it("should create activity without metadata", async () => {
    vi.mocked(db.activity.create).mockResolvedValueOnce({
      id: "activity-1",
      action: "ISSUE_CREATED",
      issueId: "issue-1",
      actorId: "user-1",
      metadata: null,
      createdAt: new Date(),
    } as never);

    await logActivity({
      action: "ISSUE_CREATED",
      issueId: "issue-1",
      actorId: "user-1",
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        action: "ISSUE_CREATED",
        issueId: "issue-1",
        actorId: "user-1",
        metadata: undefined,
      },
    });
  });

  it("should silently fail on database error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(db.activity.create).mockRejectedValueOnce(new Error("DB Error"));

    // Should not throw
    await expect(
      logActivity({
        action: "ISSUE_CREATED",
        issueId: "issue-1",
        actorId: "user-1",
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to log activity:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

describe("getActivitiesByIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return activities ordered by createdAt desc", async () => {
    const mockActivities = [
      {
        id: "activity-2",
        action: "ISSUE_UPDATED",
        issueId: "issue-1",
        actorId: "user-1",
        createdAt: new Date("2024-01-02"),
        actor: { id: "user-1", name: "User 1", email: "user1@test.com", image: null },
      },
      {
        id: "activity-1",
        action: "ISSUE_CREATED",
        issueId: "issue-1",
        actorId: "user-1",
        createdAt: new Date("2024-01-01"),
        actor: { id: "user-1", name: "User 1", email: "user1@test.com", image: null },
      },
    ];

    vi.mocked(db.activity.findMany).mockResolvedValueOnce(mockActivities as never);

    const result = await getActivitiesByIssue("issue-1");

    expect(db.activity.findMany).toHaveBeenCalledWith({
      where: { issueId: "issue-1" },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("activity-2");
  });

  it("should return empty array when no activities", async () => {
    vi.mocked(db.activity.findMany).mockResolvedValueOnce([]);

    const result = await getActivitiesByIssue("issue-no-activities");

    expect(result).toEqual([]);
  });
});
