import { describe, it, expect, vi, beforeEach } from "vitest";
import { createComment, updateComment, deleteComment, getCommentsByIssue } from "./comment";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createComment as createCommentFactory } from "@/test/factories/comment";
import { createIssue, createProject } from "@/test/factories/issue";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

describe("getCommentsByIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return comments ordered by createdAt asc", async () => {
    const mockComments = [
      createCommentFactory({ id: "comment-1", createdAt: new Date("2024-01-01") }),
      createCommentFactory({ id: "comment-2", createdAt: new Date("2024-01-02") }),
    ];

    vi.mocked(db.comment.findMany).mockResolvedValueOnce(mockComments as never);

    const result = await getCommentsByIssue("issue-1");

    expect(db.comment.findMany).toHaveBeenCalledWith({
      where: { issueId: "issue-1" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    expect(result).toHaveLength(2);
  });
});

describe("createComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for invalid data", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await createComment({
      content: "",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Comment cannot be empty" });
  });

  it("should return error for invalid issueId", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await createComment({
      content: "Valid content",
      issueId: "invalid-id",
    });

    expect(result).toEqual({ error: "Invalid issue ID" });
  });

  it("should return error when issue not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Issue not found" });
  });

  it("should return error when user has no access to workspace", async () => {
    mockAuthenticatedUser({ id: "user-no-access" });

    const workspace = createWorkspace({ ownerId: "other-owner", members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "You don't have access to this issue" });
  });

  it("should create comment when user is workspace owner", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const createdComment = createCommentFactory({
      content: "Test comment",
      authorId: "owner-1",
    });
    vi.mocked(db.comment.create).mockResolvedValueOnce(createdComment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result.data).toBeDefined();
    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "COMMENT_ADDED",
        actorId: "owner-1",
      }),
    });
  });

  it("should create comment when user is workspace member", async () => {
    mockAuthenticatedUser({ id: "member-1" });

    const member = createWorkspaceMember({ userId: "member-1" });
    const workspace = createWorkspace({ ownerId: "other-owner", members: [member] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const createdComment = createCommentFactory({
      content: "Test comment",
      authorId: "member-1",
    });
    vi.mocked(db.comment.create).mockResolvedValueOnce(createdComment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result.data).toBeDefined();
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.comment.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createComment({
      content: "Test comment",
      issueId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Failed to create comment" });
    consoleSpy.mockRestore();
  });
});

describe("updateComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await updateComment("comment-1", { content: "Updated" });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for empty content", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await updateComment("comment-1", { content: "" });

    expect(result).toEqual({ error: "Comment cannot be empty" });
  });

  it("should return error when comment not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(null);

    const result = await updateComment("comment-1", { content: "Updated" });

    expect(result).toEqual({ error: "Comment not found" });
  });

  it("should return error when user is not the author", async () => {
    mockAuthenticatedUser({ id: "other-user" });

    const workspace = createWorkspace();
    const project = createProject({ workspace });
    const comment = createCommentFactory({
      authorId: "original-author",
      issue: {
        id: "issue-1",
        project: {
          key: project.key,
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);

    const result = await updateComment("comment-1", { content: "Updated" });

    expect(result).toEqual({ error: "You can only edit your own comments" });
  });

  it("should update comment when user is author", async () => {
    mockAuthenticatedUser({ id: "author-1" });

    const workspace = createWorkspace();
    const project = createProject({ workspace });
    const comment = createCommentFactory({
      authorId: "author-1",
      issue: {
        id: "issue-1",
        project: {
          key: project.key,
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);

    const updatedComment = { ...comment, content: "Updated content" };
    vi.mocked(db.comment.update).mockResolvedValueOnce(updatedComment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await updateComment("comment-1", { content: "Updated content" });

    expect(result.data).toBeDefined();
    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "COMMENT_UPDATED",
        actorId: "author-1",
      }),
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "author-1" });

    const workspace = createWorkspace();
    const project = createProject({ workspace });
    const comment = createCommentFactory({
      authorId: "author-1",
      issue: {
        id: "issue-1",
        project: {
          key: project.key,
          workspace: {
            slug: workspace.slug,
            ownerId: workspace.ownerId,
            members: [],
          },
        },
      },
    });

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);
    vi.mocked(db.comment.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateComment("comment-1", { content: "Updated" });

    expect(result).toEqual({ error: "Failed to update comment" });
    consoleSpy.mockRestore();
  });
});

describe("deleteComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when comment not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(null);

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ error: "Comment not found" });
  });

  it("should allow author to delete their comment", async () => {
    mockAuthenticatedUser({ id: "author-1" });

    const workspace = createWorkspace({ ownerId: "other-owner" });
    const comment = createCommentFactory({
      authorId: "author-1",
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

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);
    vi.mocked(db.comment.delete).mockResolvedValueOnce(comment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ success: true });
    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "COMMENT_DELETED",
        actorId: "author-1",
      }),
    });
  });

  it("should allow workspace owner to delete any comment", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1" });
    const comment = createCommentFactory({
      authorId: "other-author",
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

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);
    vi.mocked(db.comment.delete).mockResolvedValueOnce(comment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ success: true });
  });

  it("should allow admin to delete any comment", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const comment = createCommentFactory({
      authorId: "other-author",
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

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);
    vi.mocked(db.comment.delete).mockResolvedValueOnce(comment as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ success: true });
  });

  it("should deny non-author non-owner non-admin from deleting", async () => {
    mockAuthenticatedUser({ id: "random-user" });

    const developerMember = createWorkspaceMember({ userId: "random-user", role: "DEVELOPER" });
    const workspace = createWorkspace({ ownerId: "other-owner" });
    const comment = createCommentFactory({
      authorId: "other-author",
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

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ error: "You don't have permission to delete this comment" });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "author-1" });

    const comment = createCommentFactory({
      authorId: "author-1",
      issue: {
        id: "issue-1",
        project: {
          key: "PROJ",
          workspace: {
            slug: "test",
            ownerId: "other-owner",
            members: [],
          },
        },
      },
    });

    vi.mocked(db.comment.findUnique).mockResolvedValueOnce(comment as never);
    vi.mocked(db.comment.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteComment("comment-1");

    expect(result).toEqual({ error: "Failed to delete comment" });
    consoleSpy.mockRestore();
  });
});
