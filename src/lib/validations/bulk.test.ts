import { describe, it, expect } from "vitest";
import {
  bulkUpdateStatusSchema,
  bulkAssignSchema,
  bulkUpdatePrioritySchema,
  bulkDeleteSchema,
} from "./bulk";

const VALID_CUID = "clyg7v3qj0000abcd1234efgh";
const VALID_CUID_2 = "clyg7v3qj0001abcd1234efgh";
const VALID_CUID_3 = "clyg7v3qj0002abcd1234efgh";

describe("bulkUpdateStatusSchema", () => {
  it("should accept valid status update with one issue", () => {
    const result = bulkUpdateStatusSchema.safeParse({
      issueIds: [VALID_CUID],
      status: "IN_PROGRESS",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid status update with multiple issues", () => {
    const result = bulkUpdateStatusSchema.safeParse({
      issueIds: [VALID_CUID, VALID_CUID_2, VALID_CUID_3],
      status: "DONE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issueIds).toHaveLength(3);
    }
  });

  it("should reject empty issueIds array", () => {
    const result = bulkUpdateStatusSchema.safeParse({
      issueIds: [],
      status: "DONE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("At least one issue is required");
    }
  });

  it("should reject invalid issueId in array", () => {
    const result = bulkUpdateStatusSchema.safeParse({
      issueIds: [VALID_CUID, "invalid-id"],
      status: "DONE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid issue ID");
    }
  });

  it("should reject invalid status", () => {
    const result = bulkUpdateStatusSchema.safeParse({
      issueIds: [VALID_CUID],
      status: "INVALID_STATUS",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid status values", () => {
    const statuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
    statuses.forEach((status) => {
      const result = bulkUpdateStatusSchema.safeParse({
        issueIds: [VALID_CUID],
        status,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("bulkAssignSchema", () => {
  it("should accept valid assign with assigneeId", () => {
    const result = bulkAssignSchema.safeParse({
      issueIds: [VALID_CUID, VALID_CUID_2],
      assigneeId: VALID_CUID_3,
    });
    expect(result.success).toBe(true);
  });

  it("should accept null assigneeId (unassign)", () => {
    const result = bulkAssignSchema.safeParse({
      issueIds: [VALID_CUID],
      assigneeId: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty issueIds array", () => {
    const result = bulkAssignSchema.safeParse({
      issueIds: [],
      assigneeId: VALID_CUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("At least one issue is required");
    }
  });

  it("should reject invalid assigneeId", () => {
    const result = bulkAssignSchema.safeParse({
      issueIds: [VALID_CUID],
      assigneeId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid user ID");
    }
  });
});

describe("bulkUpdatePrioritySchema", () => {
  it("should accept valid priority update", () => {
    const result = bulkUpdatePrioritySchema.safeParse({
      issueIds: [VALID_CUID, VALID_CUID_2],
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("should accept all valid priority values", () => {
    const priorities = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];
    priorities.forEach((priority) => {
      const result = bulkUpdatePrioritySchema.safeParse({
        issueIds: [VALID_CUID],
        priority,
      });
      expect(result.success).toBe(true);
    });
  });

  it("should reject empty issueIds array", () => {
    const result = bulkUpdatePrioritySchema.safeParse({
      issueIds: [],
      priority: "HIGH",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority", () => {
    const result = bulkUpdatePrioritySchema.safeParse({
      issueIds: [VALID_CUID],
      priority: "INVALID_PRIORITY",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkDeleteSchema", () => {
  it("should accept valid delete with one issue", () => {
    const result = bulkDeleteSchema.safeParse({
      issueIds: [VALID_CUID],
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid delete with multiple issues", () => {
    const result = bulkDeleteSchema.safeParse({
      issueIds: [VALID_CUID, VALID_CUID_2, VALID_CUID_3],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issueIds).toHaveLength(3);
    }
  });

  it("should reject empty issueIds array", () => {
    const result = bulkDeleteSchema.safeParse({
      issueIds: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("At least one issue is required");
    }
  });

  it("should reject invalid issueId in array", () => {
    const result = bulkDeleteSchema.safeParse({
      issueIds: ["invalid-id"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid issue ID");
    }
  });
});
