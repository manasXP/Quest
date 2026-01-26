import { describe, it, expect } from "vitest";
import { createSavedFilterSchema, updateSavedFilterSchema } from "./filter";

const VALID_CUID = "clyg7v3qj0000abcd1234efgh";

describe("createSavedFilterSchema", () => {
  it("should accept valid filter data", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "My Active Tasks",
      filters: { status: ["TODO", "IN_PROGRESS"] },
      projectId: VALID_CUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Active Tasks");
      expect(result.data.isDefault).toBe(false);
    }
  });

  it("should accept filter with isDefault true", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "Default View",
      filters: {},
      projectId: VALID_CUID,
      isDefault: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(true);
    }
  });

  it("should reject empty name", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "",
      filters: {},
      projectId: VALID_CUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("should reject name over 50 characters", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "a".repeat(51),
      filters: {},
      projectId: VALID_CUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name must be less than 50 characters");
    }
  });

  it("should reject invalid projectId", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "Valid name",
      filters: {},
      projectId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid project ID");
    }
  });

  it("should accept complex filters object", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "Complex Filter",
      filters: {
        status: ["TODO", "IN_PROGRESS"],
        priority: ["HIGH", "URGENT"],
        type: ["BUG"],
        assigneeId: [VALID_CUID],
      },
      projectId: VALID_CUID,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty filters object", () => {
    const result = createSavedFilterSchema.safeParse({
      name: "All Issues",
      filters: {},
      projectId: VALID_CUID,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateSavedFilterSchema", () => {
  it("should accept partial updates with name only", () => {
    const result = updateSavedFilterSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should accept partial updates with filters only", () => {
    const result = updateSavedFilterSchema.safeParse({
      filters: { status: ["DONE"] },
    });
    expect(result.success).toBe(true);
  });

  it("should accept partial updates with isDefault only", () => {
    const result = updateSavedFilterSchema.safeParse({
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty update object", () => {
    const result = updateSavedFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject empty name when provided", () => {
    const result = updateSavedFilterSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("should reject name over 50 characters when provided", () => {
    const result = updateSavedFilterSchema.safeParse({
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});
