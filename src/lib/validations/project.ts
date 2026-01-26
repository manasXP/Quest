import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(10, "Key must be less than 10 characters")
    .regex(
      /^[A-Z][A-Z0-9]*$/,
      "Key must start with a letter and contain only uppercase letters and numbers"
    ),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  workspaceId: z.string().cuid("Invalid workspace ID"),
  leadId: z.string().cuid("Invalid user ID").optional(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ workspaceId: true });

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;
