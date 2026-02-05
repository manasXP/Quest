import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestPasswordReset, resetPassword } from "./auth";
import { db } from "@/lib/db";
import { createUser } from "@/test/factories/user";
import { sendPasswordResetEmail } from "@/lib/email";

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid email format", async () => {
    const result = await requestPasswordReset({ email: "invalid-email" });
    expect(result).toEqual({ error: "Please enter a valid email address" });
  });

  it("should return success even if user does not exist (prevent email enumeration)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const result = await requestPasswordReset({ email: "nonexistent@test.com" });

    expect(result).toEqual({ success: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should return success for OAuth-only user without password (prevent email enumeration)", async () => {
    const oauthUser = createUser({ password: null });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(oauthUser as never);

    const result = await requestPasswordReset({ email: oauthUser.email });

    expect(result).toEqual({ success: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should create token and send email for valid user with password", async () => {
    const user = createUser({ password: "hashedpassword123" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(db.verificationToken.create).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);

    const result = await requestPasswordReset({ email: user.email });

    expect(result).toEqual({ success: true });
    expect(db.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: user.email },
    });
    expect(db.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: user.email,
        token: expect.any(String),
        expires: expect.any(Date),
      }),
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      user.email,
      expect.any(String)
    );
  });

  it("should set token expiry to 1 hour", async () => {
    const user = createUser({ password: "hashedpassword123" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(db.verificationToken.create).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);

    await requestPasswordReset({ email: user.email });

    const createCall = vi.mocked(db.verificationToken.create).mock.calls[0][0];
    const expires = createCall.data.expires as Date;
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    expect(expires.getTime()).toBeCloseTo(oneHourFromNow, -4); // Within ~10 seconds
  });

  it("should return success even if email sending fails (prevent enumeration)", async () => {
    const user = createUser({ password: "hashedpassword123" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(db.verificationToken.create).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });
    vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce(
      new Error("Email failed")
    );

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await requestPasswordReset({ email: user.email });

    expect(result).toEqual({ success: true });
    consoleSpy.mockRestore();
  });

  it("should delete existing tokens before creating new one", async () => {
    const user = createUser({ password: "hashedpassword123" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.deleteMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(db.verificationToken.create).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);

    await requestPasswordReset({ email: user.email });

    expect(db.verificationToken.deleteMany).toHaveBeenCalledBefore(
      vi.mocked(db.verificationToken.create)
    );
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid token format", async () => {
    const result = await resetPassword({
      token: "",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    expect(result).toEqual({ error: "Reset token is required" });
  });

  it("should return error for password without uppercase", async () => {
    const result = await resetPassword({
      token: "validtoken123",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result).toEqual({ error: "Password must contain an uppercase letter" });
  });

  it("should return error for mismatched passwords", async () => {
    const result = await resetPassword({
      token: "validtoken123",
      password: "Password123",
      confirmPassword: "DifferentPassword123",
    });

    expect(result).toEqual({ error: "Passwords don't match" });
  });

  it("should return error for invalid or expired token", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce(null);

    const result = await resetPassword({
      token: "invalidtoken",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(result).toEqual({ error: "Invalid or expired reset link" });
  });

  it("should return error if user not found", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce({
      identifier: "user@test.com",
      token: "hashedtoken",
      expires: new Date(Date.now() + 3600000),
    });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const result = await resetPassword({
      token: "validtoken",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(result).toEqual({ error: "User not found" });
  });

  it("should successfully reset password", async () => {
    const user = createUser({ password: "oldhash" });
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(Date.now() + 3600000),
    });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.user.update).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.delete).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });

    const result = await resetPassword({
      token: "validtoken",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    expect(result).toEqual({ success: true });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { password: expect.any(String) },
    });
  });

  it("should delete the token after successful reset", async () => {
    const user = createUser({ password: "oldhash" });
    const tokenData = {
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(Date.now() + 3600000),
    };
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce(tokenData);
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.user.update).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.delete).mockResolvedValueOnce(tokenData);

    await resetPassword({
      token: "validtoken",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    expect(db.verificationToken.delete).toHaveBeenCalledWith({
      where: {
        identifier_token: {
          identifier: user.email,
          token: expect.any(String),
        },
      },
    });
  });

  it("should hash the new password before storing", async () => {
    const user = createUser({ password: "oldhash" });
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(Date.now() + 3600000),
    });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.user.update).mockResolvedValueOnce(user as never);
    vi.mocked(db.verificationToken.delete).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(),
    });

    await resetPassword({
      token: "validtoken",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    const updateCall = vi.mocked(db.user.update).mock.calls[0][0];
    // Password should be hashed, not the plain text
    expect(updateCall.data.password).not.toBe("NewPassword123");
    expect(typeof updateCall.data.password).toBe("string");
    expect((updateCall.data.password as string).length).toBeGreaterThan(20);
  });

  it("should handle database error gracefully", async () => {
    const user = createUser({ password: "oldhash" });
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce({
      identifier: user.email,
      token: "hashedtoken",
      expires: new Date(Date.now() + 3600000),
    });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(user as never);
    vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resetPassword({
      token: "validtoken",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    expect(result).toEqual({ error: "Failed to reset password. Please try again." });
    consoleSpy.mockRestore();
  });

  it("should check token expiry", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValueOnce(null);

    await resetPassword({
      token: "validtoken",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });

    expect(db.verificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: expect.any(String),
        expires: { gt: expect.any(Date) },
      },
    });
  });
});
