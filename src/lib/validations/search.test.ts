import { describe, it, expect } from "vitest";
import { issueFilterSchema } from "./search";

describe("issueFilterSchema", () => {
  it("should accept empty object (all fields optional)", () => {
    const result = issueFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept search string", () => {
    const result = issueFilterSchema.safeParse({
      search: "bug fix",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("bug fix");
    }
  });

  it("should accept empty search string", () => {
    const result = issueFilterSchema.safeParse({
      search: "",
    });
    expect(result.success).toBe(true);
  });

  describe("status filter", () => {
    it("should accept valid status array", () => {
      const result = issueFilterSchema.safeParse({
        status: ["BACKLOG", "TODO"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid status values", () => {
      const result = issueFilterSchema.safeParse({
        status: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status values", () => {
      const result = issueFilterSchema.safeParse({
        status: ["INVALID_STATUS"],
      });
      expect(result.success).toBe(false);
    });

    it("should accept empty status array", () => {
      const result = issueFilterSchema.safeParse({
        status: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("priority filter", () => {
    it("should accept valid priority array", () => {
      const result = issueFilterSchema.safeParse({
        priority: ["HIGH", "URGENT"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid priority values", () => {
      const result = issueFilterSchema.safeParse({
        priority: ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid priority values", () => {
      const result = issueFilterSchema.safeParse({
        priority: ["CRITICAL"],
      });
      expect(result.success).toBe(false);
    });

    it("should accept empty priority array", () => {
      const result = issueFilterSchema.safeParse({
        priority: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("type filter", () => {
    it("should accept valid type array", () => {
      const result = issueFilterSchema.safeParse({
        type: ["BUG", "TASK"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid type values", () => {
      const result = issueFilterSchema.safeParse({
        type: ["EPIC", "STORY", "TASK", "BUG"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid type values", () => {
      const result = issueFilterSchema.safeParse({
        type: ["FEATURE"],
      });
      expect(result.success).toBe(false);
    });

    it("should accept empty type array", () => {
      const result = issueFilterSchema.safeParse({
        type: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("assigneeId filter", () => {
    it("should accept string array for assigneeId", () => {
      const result = issueFilterSchema.safeParse({
        assigneeId: ["user-1", "user-2"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty assigneeId array", () => {
      const result = issueFilterSchema.safeParse({
        assigneeId: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("labelIds filter", () => {
    it("should accept string array for labelIds", () => {
      const result = issueFilterSchema.safeParse({
        labelIds: ["label-1", "label-2"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty labelIds array", () => {
      const result = issueFilterSchema.safeParse({
        labelIds: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("combined filters", () => {
    it("should accept multiple filters together", () => {
      const result = issueFilterSchema.safeParse({
        search: "login bug",
        status: ["IN_PROGRESS", "IN_REVIEW"],
        priority: ["HIGH", "URGENT"],
        type: ["BUG"],
        assigneeId: ["user-123"],
        labelIds: ["label-456"],
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial filters", () => {
      const result = issueFilterSchema.safeParse({
        status: ["DONE"],
        type: ["TASK"],
      });
      expect(result.success).toBe(true);
    });
  });
});
