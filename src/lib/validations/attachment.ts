import { z } from "zod";

export const uploadAttachmentSchema = z.object({
  issueId: z.string().cuid("Invalid issue ID"),
});

export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().cuid("Invalid attachment ID"),
});

export type UploadAttachmentSchema = z.infer<typeof uploadAttachmentSchema>;
export type DeleteAttachmentSchema = z.infer<typeof deleteAttachmentSchema>;
