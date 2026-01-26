import { z } from "zod";
import { issueStatusSchema, issuePrioritySchema } from "./issue";

export const bulkUpdateStatusSchema = z.object({
  issueIds: z.array(z.string().cuid("Invalid issue ID")).min(1, "At least one issue is required"),
  status: issueStatusSchema,
});

export const bulkAssignSchema = z.object({
  issueIds: z.array(z.string().cuid("Invalid issue ID")).min(1, "At least one issue is required"),
  assigneeId: z.string().cuid("Invalid user ID").nullable(),
});

export const bulkUpdatePrioritySchema = z.object({
  issueIds: z.array(z.string().cuid("Invalid issue ID")).min(1, "At least one issue is required"),
  priority: issuePrioritySchema,
});

export const bulkDeleteSchema = z.object({
  issueIds: z.array(z.string().cuid("Invalid issue ID")).min(1, "At least one issue is required"),
});

export type BulkUpdateStatusSchema = z.infer<typeof bulkUpdateStatusSchema>;
export type BulkAssignSchema = z.infer<typeof bulkAssignSchema>;
export type BulkUpdatePrioritySchema = z.infer<typeof bulkUpdatePrioritySchema>;
export type BulkDeleteSchema = z.infer<typeof bulkDeleteSchema>;
