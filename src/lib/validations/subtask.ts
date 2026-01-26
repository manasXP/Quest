import { z } from "zod";
import { issueTypeSchema, issuePrioritySchema } from "./issue";

// Subtasks can only be TASK or BUG (not EPIC or STORY)
export const subtaskTypeSchema = z.enum(["TASK", "BUG"]);

export const createSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(10000, "Description is too long").optional(),
  type: subtaskTypeSchema.default("TASK"),
  priority: issuePrioritySchema.default("MEDIUM"),
  parentId: z.string().cuid("Invalid parent issue ID"),
  assigneeId: z.string().cuid("Invalid user ID").nullable().optional(),
});

export const updateSubtaskStatusSchema = z.object({
  subtaskId: z.string().cuid("Invalid subtask ID"),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
});

export type CreateSubtaskSchema = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskStatusSchema = z.infer<typeof updateSubtaskStatusSchema>;
