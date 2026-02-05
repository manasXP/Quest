import { z } from "zod";

export const issueTypeSchema = z.enum(["EPIC", "STORY", "TASK", "BUG"]);
export const issueStatusSchema = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]);
export const issuePrioritySchema = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]);

export const createIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(10000, "Description is too long").optional(),
  type: issueTypeSchema.default("TASK"),
  status: issueStatusSchema.default("BACKLOG"),
  priority: issuePrioritySchema.default("MEDIUM"),
  projectId: z.string().cuid("Invalid project ID"),
  assigneeId: z.string().cuid("Invalid user ID").nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  flagged: z.boolean().default(false),
  parentId: z.string().cuid("Invalid issue ID").nullable().optional(),
  sprintId: z.string().cuid("Invalid sprint ID").nullable().optional(),
  labelIds: z.array(z.string().cuid("Invalid label ID")).optional(),
});

export const updateIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z.string().max(10000, "Description is too long").nullable().optional(),
  type: issueTypeSchema.optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().cuid("Invalid user ID").nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  order: z.number().int().min(0).optional(),
  labelIds: z.array(z.string().cuid("Invalid label ID")).optional(),
});

export const moveIssueSchema = z.object({
  issueId: z.string().cuid("Invalid issue ID"),
  status: issueStatusSchema,
  order: z.number().int().min(0),
});

export type CreateIssueSchema = z.infer<typeof createIssueSchema>;
export type UpdateIssueSchema = z.infer<typeof updateIssueSchema>;
export type MoveIssueSchema = z.infer<typeof moveIssueSchema>;
