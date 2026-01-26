import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkUpdateStatus, bulkAssign, bulkUpdatePriority, bulkDelete } from "./bulk";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createIssue, createProject } from "@/test/factories/issue";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_ISSUE_ID_1 = "clyg7v3qj0003isu11234abcd";
const VALID_ISSUE_ID_2 = "clyg7v3qj0004isu21234abcd";
const VALID_ASSIGNEE_ID = "clyg7v3qj0005asgn1234abcd";

describe("bulkUpdateStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1],
      status: "DONE",
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for empty issueIds", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await bulkUpdateStatus({
      issueIds: [],
      status: "DONE",
    });

    expect(result).toEqual({ error: "At least one issue is required" });
  });

  it("should return error for invalid issueId", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await bulkUpdateStatus({
      issueIds: ["invalid-id"],
      status: "DONE",
    });

    expect(result).toEqual({ error: "Invalid issue ID" });
  });

  it("should return error when some issues not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);

    const result = await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      status: "DONE",
    });

    expect(result).toEqual({ error: "Some issues were not found" });
  });

  it("should return error when user has no access to some issues", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);

    const result = await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      status: "DONE",
    });

    expect(result).toEqual({ error: "You don't have permission to modify some of these issues" });
  });

  it("should update status for all issues when user has access", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, status: "TODO" });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project, status: "IN_PROGRESS" });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 2 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    const result = await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      status: "DONE",
    });

    expect(result).toEqual({ success: true, count: 2 });
    expect(db.issue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2] } },
      data: { status: "DONE" },
    });
  });

  it("should log activity for each issue", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, status: "TODO" });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project, status: "IN_PROGRESS" });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 2 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      status: "DONE",
    });

    expect(db.activity.create).toHaveBeenCalledTimes(2);
    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_STATUS_CHANGED",
        issueId: VALID_ISSUE_ID_1,
        metadata: {
          field: "status",
          oldValue: "TODO",
          newValue: "DONE",
        },
      }),
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.updateMany).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await bulkUpdateStatus({
      issueIds: [VALID_ISSUE_ID_1],
      status: "DONE",
    });

    expect(result).toEqual({ error: "Failed to update issues" });
    consoleSpy.mockRestore();
  });
});

describe("bulkAssign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await bulkAssign({
      issueIds: [VALID_ISSUE_ID_1],
      assigneeId: VALID_ASSIGNEE_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should assign issues to user", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, assigneeId: null });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project, assigneeId: null });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 2 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    const result = await bulkAssign({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      assigneeId: VALID_ASSIGNEE_ID,
    });

    expect(result).toEqual({ success: true, count: 2 });
    expect(db.issue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2] } },
      data: { assigneeId: VALID_ASSIGNEE_ID },
    });
  });

  it("should unassign issues when assigneeId is null", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, assigneeId: VALID_ASSIGNEE_ID });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    const result = await bulkAssign({
      issueIds: [VALID_ISSUE_ID_1],
      assigneeId: null,
    });

    expect(result).toEqual({ success: true, count: 1 });
    expect(db.issue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [VALID_ISSUE_ID_1] } },
      data: { assigneeId: null },
    });
  });

  it("should log ISSUE_ASSIGNED activity for each issue", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, assigneeId: null });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await bulkAssign({
      issueIds: [VALID_ISSUE_ID_1],
      assigneeId: VALID_ASSIGNEE_ID,
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_ASSIGNED",
        metadata: {
          field: "assignee",
          oldValue: null,
          newValue: VALID_ASSIGNEE_ID,
        },
      }),
    });
  });
});

describe("bulkUpdatePriority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await bulkUpdatePriority({
      issueIds: [VALID_ISSUE_ID_1],
      priority: "HIGH",
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should update priority for all issues", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, priority: "MEDIUM" });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project, priority: "LOW" });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 2 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    const result = await bulkUpdatePriority({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
      priority: "HIGH",
    });

    expect(result).toEqual({ success: true, count: 2 });
    expect(db.issue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2] } },
      data: { priority: "HIGH" },
    });
  });

  it("should log ISSUE_PRIORITY_CHANGED activity for each issue", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project, priority: "MEDIUM" });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(db.activity.create).mockResolvedValue({} as never);

    await bulkUpdatePriority({
      issueIds: [VALID_ISSUE_ID_1],
      priority: "URGENT",
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_PRIORITY_CHANGED",
        metadata: {
          field: "priority",
          oldValue: "MEDIUM",
          newValue: "URGENT",
        },
      }),
    });
  });
});

describe("bulkDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await bulkDelete({
      issueIds: [VALID_ISSUE_ID_1],
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for empty issueIds", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await bulkDelete({
      issueIds: [],
    });

    expect(result).toEqual({ error: "At least one issue is required" });
  });

  it("should delete all issues when user has access", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });
    const issue2 = createIssue({ id: VALID_ISSUE_ID_2, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1, issue2] as never);
    vi.mocked(db.issue.deleteMany).mockResolvedValueOnce({ count: 2 } as never);

    const result = await bulkDelete({
      issueIds: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2],
    });

    expect(result).toEqual({ success: true, count: 2 });
    expect(db.issue.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [VALID_ISSUE_ID_1, VALID_ISSUE_ID_2] } },
    });
  });

  it("should allow workspace member to delete issues", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const member = createWorkspaceMember({ userId: VALID_USER_ID });
    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [member] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.deleteMany).mockResolvedValueOnce({ count: 1 } as never);

    const result = await bulkDelete({
      issueIds: [VALID_ISSUE_ID_1],
    });

    expect(result).toEqual({ success: true, count: 1 });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue1 = createIssue({ id: VALID_ISSUE_ID_1, project });

    vi.mocked(db.issue.findMany).mockResolvedValueOnce([issue1] as never);
    vi.mocked(db.issue.deleteMany).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await bulkDelete({
      issueIds: [VALID_ISSUE_ID_1],
    });

    expect(result).toEqual({ error: "Failed to delete issues" });
    consoleSpy.mockRestore();
  });
});
