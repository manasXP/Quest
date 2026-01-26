import { describe, it, expect } from "vitest";
import { createCommentSchema, updateCommentSchema } from "./comment";

describe("createCommentSchema", () => {
  it("should accept valid comment data", () => {
    const result = createCommentSchema.safeParse({
      content: "This is a valid comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("This is a valid comment");
    }
  });

  it("should reject empty content", () => {
    const result = createCommentSchema.safeParse({
      content: "",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Comment cannot be empty");
    }
  });

  it("should reject content over 10000 characters", () => {
    const longContent = "a".repeat(10001);
    const result = createCommentSchema.safeParse({
      content: longContent,
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Comment is too long");
    }
  });

  it("should accept content exactly 10000 characters", () => {
    const maxContent = "a".repeat(10000);
    const result = createCommentSchema.safeParse({
      content: maxContent,
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid issueId format", () => {
    const result = createCommentSchema.safeParse({
      content: "Valid content",
      issueId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid issue ID");
    }
  });

  it("should reject missing issueId", () => {
    const result = createCommentSchema.safeParse({
      content: "Valid content",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing content", () => {
    const result = createCommentSchema.safeParse({
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCommentSchema", () => {
  it("should accept valid content", () => {
    const result = updateCommentSchema.safeParse({
      content: "Updated comment content",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const result = updateCommentSchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Comment cannot be empty");
    }
  });

  it("should reject content over 10000 characters", () => {
    const longContent = "a".repeat(10001);
    const result = updateCommentSchema.safeParse({
      content: longContent,
    });
    expect(result.success).toBe(false);
  });
});
