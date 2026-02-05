import { describe, it, expect } from "vitest";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./password-reset";

describe("requestPasswordResetSchema", () => {
  it("should accept valid email", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("should reject invalid email format", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Please enter a valid email address"
      );
    }
  });

  it("should reject empty email", () => {
    const result = requestPasswordResetSchema.safeParse({
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const result = requestPasswordResetSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validData = {
    token: "abc123def456",
    password: "Password123",
    confirmPassword: "Password123",
  };

  it("should accept valid reset data", () => {
    const result = resetPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toBe("abc123def456");
      expect(result.data.password).toBe("Password123");
    }
  });

  it("should reject empty token", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      token: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Reset token is required");
    }
  });

  it("should reject password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 8 characters"
      );
    }
  });

  it("should reject password without lowercase letter", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      password: "PASSWORD123",
      confirmPassword: "PASSWORD123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must contain a lowercase letter"
      );
    }
  });

  it("should reject password without uppercase letter", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must contain an uppercase letter"
      );
    }
  });

  it("should reject password without number", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      password: "PasswordAbc",
      confirmPassword: "PasswordAbc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must contain a number"
      );
    }
  });

  it("should reject mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      ...validData,
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords don't match");
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("should reject missing confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123def456",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("should accept complex valid password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "MyC0mpl3xP@ssw0rd!",
      confirmPassword: "MyC0mpl3xP@ssw0rd!",
    });
    expect(result.success).toBe(true);
  });
});
