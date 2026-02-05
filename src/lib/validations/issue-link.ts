import { z } from "zod";

export const linkTypeSchema = z.enum([
  "BLOCKS",
  "IS_BLOCKED_BY",
  "RELATES_TO",
  "DUPLICATES",
  "IS_DUPLICATED_BY",
]);

export const createIssueLinkSchema = z.object({
  type: linkTypeSchema,
  fromIssueId: z.string().cuid("Invalid issue ID"),
  toIssueId: z.string().cuid("Invalid issue ID"),
});

export type LinkType = z.infer<typeof linkTypeSchema>;
export type CreateIssueLinkSchema = z.infer<typeof createIssueLinkSchema>;
