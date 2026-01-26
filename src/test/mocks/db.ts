import { vi } from "vitest";
import { db } from "@/lib/db";

// Re-export the mocked db for direct access
export const mockDb = vi.mocked(db);

// Helper to reset all database mocks
export function resetDbMocks() {
  vi.mocked(db.activity.create).mockReset();
  vi.mocked(db.activity.findMany).mockReset();
  vi.mocked(db.comment.create).mockReset();
  vi.mocked(db.comment.findMany).mockReset();
  vi.mocked(db.comment.findUnique).mockReset();
  vi.mocked(db.comment.update).mockReset();
  vi.mocked(db.comment.delete).mockReset();
  vi.mocked(db.invitation.create).mockReset();
  vi.mocked(db.invitation.findFirst).mockReset();
  vi.mocked(db.invitation.findUnique).mockReset();
  vi.mocked(db.invitation.update).mockReset();
  vi.mocked(db.invitation.delete).mockReset();
  vi.mocked(db.issue.create).mockReset();
  vi.mocked(db.issue.findFirst).mockReset();
  vi.mocked(db.issue.findUnique).mockReset();
  vi.mocked(db.issue.findMany).mockReset();
  vi.mocked(db.issue.update).mockReset();
  vi.mocked(db.issue.delete).mockReset();
  vi.mocked(db.issue.aggregate).mockReset();
  vi.mocked(db.project.findUnique).mockReset();
  vi.mocked(db.workspace.findUnique).mockReset();
  vi.mocked(db.workspaceMember.create).mockReset();
  vi.mocked(db.workspaceMember.findFirst).mockReset();
  vi.mocked(db.workspaceMember.findUnique).mockReset();
  vi.mocked(db.workspaceMember.delete).mockReset();
  vi.mocked(db.user.findUnique).mockReset();
  vi.mocked(db.$transaction).mockReset();
}
