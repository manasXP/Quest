import { z } from "zod";

export const sprintStatusSchema = z.enum(["PLANNED", "ACTIVE", "COMPLETED"]);

export const createSprintSchema = z.object({
  name: z
    .string()
    .min(1, "Sprint name is required")
    .max(100, "Sprint name must be less than 100 characters"),
  goal: z.string().max(1000, "Goal is too long").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectId: z.string().cuid("Invalid project ID"),
});

export const updateSprintSchema = z.object({
  name: z
    .string()
    .min(1, "Sprint name is required")
    .max(100, "Sprint name must be less than 100 characters")
    .optional(),
  goal: z.string().max(1000, "Goal is too long").nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  status: sprintStatusSchema.optional(),
});

export type CreateSprintSchema = z.infer<typeof createSprintSchema>;
export type UpdateSprintSchema = z.infer<typeof updateSprintSchema>;
