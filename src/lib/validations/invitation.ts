import { z } from "zod";

export const workspaceRoleSchema = z.enum(["ADMIN", "DEVELOPER", "TESTER", "GUEST"]);

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: workspaceRoleSchema.default("DEVELOPER"),
  workspaceId: z.string().cuid("Invalid workspace ID"),
});

export const respondToInvitationSchema = z.object({
  token: z.string().cuid("Invalid invitation token"),
  accept: z.boolean(),
});

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;
export type RespondToInvitationSchema = z.infer<typeof respondToInvitationSchema>;
