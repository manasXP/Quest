import { z } from "zod";
import { issueFilterSchema } from "./search";

export const createSavedFilterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  filters: issueFilterSchema,
  projectId: z.string().cuid("Invalid project ID"),
  isDefault: z.boolean().default(false),
});

export const updateSavedFilterSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  filters: issueFilterSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type CreateSavedFilterSchema = z.infer<typeof createSavedFilterSchema>;
export type UpdateSavedFilterSchema = z.infer<typeof updateSavedFilterSchema>;
