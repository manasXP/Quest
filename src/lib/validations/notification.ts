import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "ISSUE_ASSIGNED",
  "ISSUE_STATUS_CHANGED",
  "COMMENT_ADDED",
]);

export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().max(500).optional(),
  link: z.string().url().optional(),
  userId: z.string().cuid("Invalid user ID"),
  actorId: z.string().cuid("Invalid user ID").optional(),
  issueId: z.string().cuid("Invalid issue ID").optional(),
});

export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
