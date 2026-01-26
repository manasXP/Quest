import { describe, it, expect } from "vitest";
import { notificationTypeSchema, createNotificationSchema } from "./notification";

const VALID_CUID = "clyg7v3qj0000abcd1234efgh";

describe("notificationTypeSchema", () => {
  it("should accept ISSUE_ASSIGNED", () => {
    const result = notificationTypeSchema.safeParse("ISSUE_ASSIGNED");
    expect(result.success).toBe(true);
  });

  it("should accept ISSUE_STATUS_CHANGED", () => {
    const result = notificationTypeSchema.safeParse("ISSUE_STATUS_CHANGED");
    expect(result.success).toBe(true);
  });

  it("should accept COMMENT_ADDED", () => {
    const result = notificationTypeSchema.safeParse("COMMENT_ADDED");
    expect(result.success).toBe(true);
  });

  it("should reject invalid type", () => {
    const result = notificationTypeSchema.safeParse("INVALID_TYPE");
    expect(result.success).toBe(false);
  });
});

describe("createNotificationSchema", () => {
  it("should accept valid notification with minimal fields", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "You were assigned to PROJ-1",
      userId: VALID_CUID,
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid notification with all fields", () => {
    const result = createNotificationSchema.safeParse({
      type: "COMMENT_ADDED",
      title: "New comment on PROJ-1",
      message: "Check this out",
      link: "https://example.com/issue/1",
      userId: VALID_CUID,
      actorId: VALID_CUID,
      issueId: VALID_CUID,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "",
      userId: VALID_CUID,
    });
    expect(result.success).toBe(false);
  });

  it("should reject title over 200 characters", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "a".repeat(201),
      userId: VALID_CUID,
    });
    expect(result.success).toBe(false);
  });

  it("should reject message over 500 characters", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      message: "a".repeat(501),
      userId: VALID_CUID,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid userId", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      userId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid user ID");
    }
  });

  it("should reject invalid actorId", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      userId: VALID_CUID,
      actorId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid user ID");
    }
  });

  it("should reject invalid issueId", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      userId: VALID_CUID,
      issueId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid issue ID");
    }
  });

  it("should reject invalid link URL", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      userId: VALID_CUID,
      link: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid URL in link", () => {
    const result = createNotificationSchema.safeParse({
      type: "ISSUE_ASSIGNED",
      title: "Valid title",
      userId: VALID_CUID,
      link: "https://example.com/board",
    });
    expect(result.success).toBe(true);
  });
});
