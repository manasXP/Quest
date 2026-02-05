import { describe, it, expect } from "vitest";
import { uploadAttachmentSchema, deleteAttachmentSchema } from "./attachment";

describe("uploadAttachmentSchema", () => {
  it("should accept valid issueId", () => {
    const result = uploadAttachmentSchema.safeParse({
      issueId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issueId).toBe("clyg7v3qj0000abcd1234efgh");
    }
  });

  it("should reject invalid issueId format", () => {
    const result = uploadAttachmentSchema.safeParse({
      issueId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid issue ID");
    }
  });

  it("should reject empty issueId", () => {
    const result = uploadAttachmentSchema.safeParse({
      issueId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing issueId", () => {
    const result = uploadAttachmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("deleteAttachmentSchema", () => {
  it("should accept valid attachmentId", () => {
    const result = deleteAttachmentSchema.safeParse({
      attachmentId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachmentId).toBe("clyg7v3qj0000abcd1234efgh");
    }
  });

  it("should reject invalid attachmentId format", () => {
    const result = deleteAttachmentSchema.safeParse({
      attachmentId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid attachment ID");
    }
  });

  it("should reject empty attachmentId", () => {
    const result = deleteAttachmentSchema.safeParse({
      attachmentId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing attachmentId", () => {
    const result = deleteAttachmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
