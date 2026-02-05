import { describe, it, expect, vi, beforeEach } from "vitest";
import { del } from "@vercel/blob";
import { getAttachmentsByIssue, deleteAttachment } from "./attachment";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createAttachment } from "@/test/factories/attachment";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

describe("getAttachmentsByIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return attachments ordered by createdAt desc", async () => {
    const mockAttachments = [
      createAttachment({ id: "attachment-2", createdAt: new Date("2024-01-02") }),
      createAttachment({ id: "attachment-1", createdAt: new Date("2024-01-01") }),
    ];

    vi.mocked(db.attachment.findMany).mockResolvedValueOnce(mockAttachments as never);

    const result = await getAttachmentsByIssue("issue-1");

    expect(db.attachment.findMany).toHaveBeenCalledWith({
      where: { issueId: "issue-1" },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    expect(result).toHaveLength(2);
  });

  it("should return empty array when no attachments exist", async () => {
    vi.mocked(db.attachment.findMany).mockResolvedValueOnce([]);

    const result = await getAttachmentsByIssue("issue-1");

    expect(result).toHaveLength(0);
  });
});

describe("deleteAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when attachment not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(null);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "Attachment not found" });
  });

  it("should allow uploader to delete their own attachment", async () => {
    mockAuthenticatedUser({ id: "uploader-1" });

    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "uploader-1",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);
    vi.mocked(del).mockResolvedValueOnce(undefined);
    vi.mocked(db.attachment.delete).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ success: true });
    expect(del).toHaveBeenCalledWith(attachment.url);
    expect(db.attachment.delete).toHaveBeenCalledWith({
      where: { id: "attachment-1" },
    });
  });

  it("should allow workspace owner to delete any attachment", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1" });
    const attachment = createAttachment({
      uploaderId: "other-user",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);
    vi.mocked(del).mockResolvedValueOnce(undefined);
    vi.mocked(db.attachment.delete).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ success: true });
  });

  it("should allow admin to delete any attachment", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "other-user",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [adminMember],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);
    vi.mocked(del).mockResolvedValueOnce(undefined);
    vi.mocked(db.attachment.delete).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ success: true });
  });

  it("should deny non-uploader non-owner non-admin from deleting", async () => {
    mockAuthenticatedUser({ id: "random-user" });

    const developerMember = createWorkspaceMember({ userId: "random-user", role: "DEVELOPER" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "original-uploader",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [developerMember],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "You don't have permission to delete this attachment" });
    expect(del).not.toHaveBeenCalled();
    expect(db.attachment.delete).not.toHaveBeenCalled();
  });

  it("should handle Vercel Blob deletion error gracefully", async () => {
    mockAuthenticatedUser({ id: "uploader-1" });

    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "uploader-1",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);
    vi.mocked(del).mockRejectedValueOnce(new Error("Blob deletion failed"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "Failed to delete attachment" });
    consoleSpy.mockRestore();
  });

  it("should handle database deletion error gracefully", async () => {
    mockAuthenticatedUser({ id: "uploader-1" });

    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "uploader-1",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);
    vi.mocked(del).mockResolvedValueOnce(undefined);
    vi.mocked(db.attachment.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "Failed to delete attachment" });
    consoleSpy.mockRestore();
  });

  it("should deny tester role from deleting other's attachment", async () => {
    mockAuthenticatedUser({ id: "tester-1" });

    const testerMember = createWorkspaceMember({ userId: "tester-1", role: "TESTER" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "original-uploader",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [testerMember],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "You don't have permission to delete this attachment" });
  });

  it("should deny guest role from deleting other's attachment", async () => {
    mockAuthenticatedUser({ id: "guest-1" });

    const guestMember = createWorkspaceMember({ userId: "guest-1", role: "GUEST" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const attachment = createAttachment({
      uploaderId: "original-uploader",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [guestMember],
          },
        },
      },
    });

    vi.mocked(db.attachment.findUnique).mockResolvedValueOnce(attachment as never);

    const result = await deleteAttachment("attachment-1");

    expect(result).toEqual({ error: "You don't have permission to delete this attachment" });
  });
});
