"use server";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { AuthError } from "next-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/password-reset";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signUp(data: {
  name: string;
  email: string;
  password: string;
}) {
  const validated = signUpSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const existingUser = await db.user.findUnique({
    where: { email: validated.data.email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(validated.data.password, 12);

  try {
    await db.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { error: "Failed to create account" };
  }
}

export async function signInWithCredentials(data: {
  email: string;
  password: string;
  callbackUrl?: string;
}) {
  const validated = signInSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: data.callbackUrl || "/workspace",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function signInWithOAuth(
  provider: "google" | "github",
  callbackUrl?: string
) {
  await signIn(provider, {
    redirectTo: callbackUrl || "/workspace",
  });
}

export async function requestPasswordReset(data: { email: string }) {
  const validated = requestPasswordResetSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { email } = validated.data;

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    // If user doesn't exist or is OAuth-only, return success anyway (prevent email enumeration)
    if (!user || !user.password) {
      return { success: true };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Set expiry to 1 hour from now
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Store hashed token in database
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    // Send email with unhashed token
    await sendPasswordResetEmail(email, token);

    return { success: true };
  } catch (error) {
    console.error("Failed to request password reset:", error);
    // Return success anyway to prevent email enumeration
    return { success: true };
  }
}

export async function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const validated = resetPasswordSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { token, password } = validated.data;

  try {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token in the database
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return { error: "Invalid or expired reset link" };
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: hashedToken,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}
