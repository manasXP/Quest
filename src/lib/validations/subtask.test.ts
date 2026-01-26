import { describe, it, expect } from "vitest";
import { createSubtaskSchema, updateSubtaskStatusSchema } from "./subtask";

const VALID_CUID = "clyg7v3qj0000abcd1234efgh";

describe("createSubtaskSchema", () => {
  it("should accept valid subtask data with minimal fields", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Fix login bug",
      parentId: VALID_CUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Fix login bug");
      expect(result.data.type).toBe("TASK");
      expect(result.data.priority).toBe("MEDIUM");
    }
  });

  it("should accept valid subtask data with all fields", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Fix login bug",
      description: "The login form crashes on mobile",
      type: "BUG",
      priority: "HIGH",
      parentId: VALID_CUID,
      assigneeId: VALID_CUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("BUG");
      expect(result.data.priority).toBe("HIGH");
    }
  });

  it("should reject empty title", () => {
    const result = createSubtaskSchema.safeParse({
      title: "",
      parentId: VALID_CUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("should reject title over 200 characters", () => {
    const result = createSubtaskSchema.safeParse({
      title: "a".repeat(201),
      parentId: VALID_CUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title must be less than 200 characters");
    }
  });

  it("should reject invalid parentId format", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid parent issue ID");
    }
  });

  it("should reject EPIC as subtask type", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      type: "EPIC",
    });
    expect(result.success).toBe(false);
  });

  it("should reject STORY as subtask type", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      type: "STORY",
    });
    expect(result.success).toBe(false);
  });

  it("should accept TASK as subtask type", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      type: "TASK",
    });
    expect(result.success).toBe(true);
  });

  it("should accept BUG as subtask type", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      type: "BUG",
    });
    expect(result.success).toBe(true);
  });

  it("should accept null assigneeId", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      assigneeId: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject description over 10000 characters", () => {
    const result = createSubtaskSchema.safeParse({
      title: "Valid title",
      parentId: VALID_CUID,
      description: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Description is too long");
    }
  });
});

describe("updateSubtaskStatusSchema", () => {
  it("should accept valid status update", () => {
    const result = updateSubtaskStatusSchema.safeParse({
      subtaskId: VALID_CUID,
      status: "DONE",
    });
    expect(result.success).toBe(true);
  });

  it("should accept all valid status values", () => {
    const statuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
    statuses.forEach((status) => {
      const result = updateSubtaskStatusSchema.safeParse({
        subtaskId: VALID_CUID,
        status,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid subtaskId", () => {
    const result = updateSubtaskStatusSchema.safeParse({
      subtaskId: "invalid-id",
      status: "DONE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid subtask ID");
    }
  });

  it("should reject invalid status value", () => {
    const result = updateSubtaskStatusSchema.safeParse({
      subtaskId: VALID_CUID,
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });
});
