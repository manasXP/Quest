"use server";

import { db } from "@/lib/db";
import type { ActivityAction } from "@prisma/client";

interface LogActivityParams {
  action: ActivityAction;
  issueId: string;
  actorId: string;
  metadata?: {
    field?: string;
    oldValue?: string | null;
    newValue?: string | null;
  };
}

export async function logActivity({
  action,
  issueId,
  actorId,
  metadata,
}: LogActivityParams) {
  try {
    await db.activity.create({
      data: {
        action,
        issueId,
        actorId,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to log activity:", error);
  }
}

export async function getActivitiesByIssue(issueId: string) {
  return db.activity.findMany({
    where: { issueId },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
