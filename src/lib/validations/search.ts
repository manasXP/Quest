import { z } from "zod";

export const issueFilterSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum([
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "DONE",
    "CANCELLED",
  ])).optional(),
  priority: z.array(z.enum([
    "URGENT",
    "HIGH",
    "MEDIUM",
    "LOW",
    "NONE",
  ])).optional(),
  type: z.array(z.enum([
    "EPIC",
    "STORY",
    "TASK",
    "BUG",
  ])).optional(),
  assigneeId: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export type IssueFilters = z.infer<typeof issueFilterSchema>;
