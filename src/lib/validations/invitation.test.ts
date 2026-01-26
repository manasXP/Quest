import { describe, it, expect } from "vitest";
import {
  createInvitationSchema,
  respondToInvitationSchema,
  workspaceRoleSchema,
} from "./invitation";

describe("workspaceRoleSchema", () => {
  it("should accept ADMIN role", () => {
    const result = workspaceRoleSchema.safeParse("ADMIN");
    expect(result.success).toBe(true);
  });

  it("should accept DEVELOPER role", () => {
    const result = workspaceRoleSchema.safeParse("DEVELOPER");
    expect(result.success).toBe(true);
  });

  it("should accept TESTER role", () => {
    const result = workspaceRoleSchema.safeParse("TESTER");
    expect(result.success).toBe(true);
  });

  it("should accept GUEST role", () => {
    const result = workspaceRoleSchema.safeParse("GUEST");
    expect(result.success).toBe(true);
  });

  it("should reject invalid role", () => {
    const result = workspaceRoleSchema.safeParse("INVALID");
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = workspaceRoleSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("createInvitationSchema", () => {
  it("should accept valid invitation data", () => {
    const result = createInvitationSchema.safeParse({
      email: "test@example.com",
      role: "DEVELOPER",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.role).toBe("DEVELOPER");
    }
  });

  it("should default role to DEVELOPER when not provided", () => {
    const result = createInvitationSchema.safeParse({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("DEVELOPER");
    }
  });

  it("should reject invalid email format", () => {
    const result = createInvitationSchema.safeParse({
      email: "not-an-email",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("should reject missing email", () => {
    const result = createInvitationSchema.safeParse({
      role: "DEVELOPER",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid workspaceId format", () => {
    const result = createInvitationSchema.safeParse({
      email: "test@example.com",
      workspaceId: "invalid-id",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid workspace ID");
    }
  });

  it("should reject invalid role value", () => {
    const result = createInvitationSchema.safeParse({
      email: "test@example.com",
      role: "SUPERADMIN",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid role values", () => {
    const roles = ["ADMIN", "DEVELOPER", "TESTER", "GUEST"] as const;
    for (const role of roles) {
      const result = createInvitationSchema.safeParse({
        email: "test@example.com",
        role,
        workspaceId: "clyg7v3qj0000abcd1234efgh",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("respondToInvitationSchema", () => {
  it("should accept valid token and accept true", () => {
    const result = respondToInvitationSchema.safeParse({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accept).toBe(true);
    }
  });

  it("should accept valid token and accept false", () => {
    const result = respondToInvitationSchema.safeParse({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accept).toBe(false);
    }
  });

  it("should reject invalid token format", () => {
    const result = respondToInvitationSchema.safeParse({
      token: "invalid-token",
      accept: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid invitation token");
    }
  });

  it("should require accept boolean", () => {
    const result = respondToInvitationSchema.safeParse({
      token: "clyg7v3qj0000abcd1234efgh",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-boolean accept values", () => {
    const result = respondToInvitationSchema.safeParse({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: "true",
    });
    expect(result.success).toBe(false);
  });
});
