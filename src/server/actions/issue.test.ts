import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIssue, updateIssue, moveIssue, deleteIssue } from "./issue";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createIssue as createIssueFactory, createProject } from "@/test/factories/issue";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

// Valid CUID format for testing
const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_MEMBER_ID = "clyg7v3qj0003mmbr1234abcd";
const VALID_PROJECT_ID = "clyg7v3qj0004proj1234abcd";
const VALID_ISSUE_ID = "clyg7v3qj0005isue1234abcd";

describe("createIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for invalid title", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createIssue({
      title: "",
      projectId: VALID_PROJECT_ID,
    });

    expect(result.error).toBeDefined();
  });

  it("should return error when project not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Project not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "You don't have access to this project" });
  });

  it("should generate correct issue key (PROJECT-1)", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace, key: "TEST" });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdIssue = createIssueFactory({ key: "TEST-1" });
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdIssue as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(db.issue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: "TEST-1",
      }),
      include: expect.any(Object),
    });
    expect(result.data).toBeDefined();
  });

  it("should generate incremented issue key (PROJECT-2)", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace, key: "TEST" });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce({ key: "TEST-5" } as never);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: 3 } } as never);

    const createdIssue = createIssueFactory({ key: "TEST-6" });
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdIssue as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(db.issue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: "TEST-6",
      }),
      include: expect.any(Object),
    });
  });

  it("should log ISSUE_CREATED activity", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdIssue = createIssueFactory();
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdIssue as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_CREATED",
        actorId: VALID_OWNER_ID,
      }),
    });
  });

  it("should allow workspace member to create issue", async () => {
    mockAuthenticatedUser({ id: VALID_MEMBER_ID });

    const member = createWorkspaceMember({ userId: VALID_MEMBER_ID });
    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [member] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdIssue = createIssueFactory();
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdIssue as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(result.data).toBeDefined();
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);
    vi.mocked(db.issue.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createIssue({
      title: "Test Issue",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Failed to create issue" });
    consoleSpy.mockRestore();
  });
});

describe("updateIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await updateIssue(VALID_ISSUE_ID, { title: "Updated" });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await updateIssue(VALID_ISSUE_ID, { title: "Updated" });

    expect(result).toEqual({ error: "Issue not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await updateIssue(VALID_ISSUE_ID, { title: "Updated" });

    expect(result).toEqual({ error: "You don't have permission to update this issue" });
  });

  it("should log ISSUE_STATUS_CHANGED when status changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, status: "BACKLOG" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, status: "IN_PROGRESS" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await updateIssue(VALID_ISSUE_ID, { status: "IN_PROGRESS" });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_STATUS_CHANGED",
        metadata: {
          field: "status",
          oldValue: "BACKLOG",
          newValue: "IN_PROGRESS",
        },
      }),
    });
  });

  it("should NOT log status change when status is same", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, status: "BACKLOG" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce(issue as never);

    await updateIssue(VALID_ISSUE_ID, { status: "BACKLOG" });

    expect(db.activity.create).not.toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_STATUS_CHANGED",
      }),
    });
  });

  it("should log ISSUE_ASSIGNED when assignee changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, assigneeId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, assigneeId: VALID_USER_ID } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    // Use a valid CUID for assigneeId
    await updateIssue(VALID_ISSUE_ID, { assigneeId: VALID_USER_ID });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_ASSIGNED",
        metadata: {
          field: "assignee",
          oldValue: null,
          newValue: VALID_USER_ID,
        },
      }),
    });
  });

  it("should log ISSUE_PRIORITY_CHANGED when priority changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, priority: "MEDIUM" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, priority: "HIGH" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await updateIssue(VALID_ISSUE_ID, { priority: "HIGH" });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_PRIORITY_CHANGED",
        metadata: {
          field: "priority",
          oldValue: "MEDIUM",
          newValue: "HIGH",
        },
      }),
    });
  });

  it("should log ISSUE_UPDATED for title changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, title: "Old Title" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, title: "New Title" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await updateIssue(VALID_ISSUE_ID, { title: "New Title" });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_UPDATED",
      }),
    });
  });

  it("should log ISSUE_UPDATED for description changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, description: "Old desc" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, description: "New desc" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await updateIssue(VALID_ISSUE_ID, { description: "New desc" });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_UPDATED",
      }),
    });
  });

  it("should log ISSUE_UPDATED for type changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, type: "TASK" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, type: "BUG" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await updateIssue(VALID_ISSUE_ID, { type: "BUG" });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_UPDATED",
      }),
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateIssue(VALID_ISSUE_ID, { title: "Updated" });

    expect(result).toEqual({ error: "Failed to update issue" });
    consoleSpy.mockRestore();
  });
});

describe("moveIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "IN_PROGRESS",
      order: 1,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "IN_PROGRESS",
      order: 1,
    });

    expect(result).toEqual({ error: "Issue not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "IN_PROGRESS",
      order: 1,
    });

    expect(result).toEqual({ error: "You don't have permission to move this issue" });
  });

  it("should log status change when status actually changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, status: "TODO" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, status: "IN_PROGRESS" } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "IN_PROGRESS",
      order: 1,
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_STATUS_CHANGED",
        metadata: {
          field: "status",
          oldValue: "TODO",
          newValue: "IN_PROGRESS",
        },
      }),
    });
  });

  it("should NOT log when only order changes (status same)", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project, status: "TODO", order: 1 });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, order: 5 } as never);

    await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "TODO",
      order: 5,
    });

    expect(db.activity.create).not.toHaveBeenCalled();
  });

  it("should update both status and order", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...issue, status: "DONE", order: 10 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    const result = await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "DONE",
      order: 10,
    });

    expect(db.issue.update).toHaveBeenCalledWith({
      where: { id: VALID_ISSUE_ID },
      data: {
        status: "DONE",
        order: 10,
      },
    });
    expect(result.data).toBeDefined();
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await moveIssue({
      issueId: VALID_ISSUE_ID,
      status: "IN_PROGRESS",
      order: 1,
    });

    expect(result).toEqual({ error: "Failed to move issue" });
    consoleSpy.mockRestore();
  });
});

describe("deleteIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ error: "Issue not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ error: "You don't have permission to delete this issue" });
  });

  it("should allow owner to delete issue", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.delete).mockResolvedValueOnce(issue as never);

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ success: true });
  });

  it("should allow member to delete issue", async () => {
    mockAuthenticatedUser({ id: VALID_MEMBER_ID });

    const member = createWorkspaceMember({ userId: VALID_MEMBER_ID });
    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [member] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.delete).mockResolvedValueOnce(issue as never);

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ success: true });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssueFactory({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issue.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteIssue(VALID_ISSUE_ID);

    expect(result).toEqual({ error: "Failed to delete issue" });
    consoleSpy.mockRestore();
  });
});
