import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSubtask, updateSubtaskStatus, getSubtasksByParent } from "./subtask";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createIssue, createProject } from "@/test/factories/issue";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_PARENT_ID = "clyg7v3qj0003prnt1234abcd";
const VALID_SUBTASK_ID = "clyg7v3qj0004sbtk1234abcd";

describe("createSubtask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for empty title", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createSubtask({
      title: "",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "Title is required" });
  });

  it("should return error for invalid parentId", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createSubtask({
      title: "Valid title",
      parentId: "invalid-id",
    });

    expect(result).toEqual({ error: "Invalid parent issue ID" });
  });

  it("should return error when parent issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "Parent issue not found" });
  });

  it("should return error when trying to create subtask of a subtask", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const parentIssue = createIssue({
      project,
      parentId: "some-other-parent-id", // This issue is already a subtask
    });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "Cannot create subtask of a subtask" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "You don't have access to this project" });
  });

  it("should create subtask when user is workspace owner", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace, key: "TEST" });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce({ key: "TEST-5" } as never);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: 2 } } as never);

    const createdSubtask = createIssue({
      key: "TEST-6",
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdSubtask as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result.data).toBeDefined();
    expect(db.issue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: "TEST-6",
        title: "Test Subtask",
        parentId: VALID_PARENT_ID,
        type: "TASK",
        status: "TODO",
      }),
      include: expect.any(Object),
    });
  });

  it("should create subtask when user is workspace member", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const member = createWorkspaceMember({ userId: VALID_USER_ID });
    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [member] });
    const project = createProject({ workspace, key: "PROJ" });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdSubtask = createIssue({ key: "PROJ-1" });
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdSubtask as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result.data).toBeDefined();
  });

  it("should create subtask with BUG type", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace, key: "TEST" });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdSubtask = createIssue({ type: "BUG" });
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdSubtask as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    await createSubtask({
      title: "Bug Subtask",
      type: "BUG",
      parentId: VALID_PARENT_ID,
    });

    expect(db.issue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "BUG",
      }),
      include: expect.any(Object),
    });
  });

  it("should log ISSUE_CREATED activity", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);

    const createdSubtask = createIssue();
    vi.mocked(db.issue.create).mockResolvedValueOnce(createdSubtask as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(db.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUE_CREATED",
        actorId: VALID_OWNER_ID,
      }),
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const parentIssue = createIssue({ project, parentId: null });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(parentIssue as never);
    vi.mocked(db.issue.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.issue.aggregate).mockResolvedValueOnce({ _max: { order: null } } as never);
    vi.mocked(db.issue.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createSubtask({
      title: "Test Subtask",
      parentId: VALID_PARENT_ID,
    });

    expect(result).toEqual({ error: "Failed to create subtask" });
    consoleSpy.mockRestore();
  });
});

describe("updateSubtaskStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "DONE",
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for invalid subtaskId", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await updateSubtaskStatus({
      subtaskId: "invalid-id",
      status: "DONE",
    });

    expect(result).toEqual({ error: "Invalid subtask ID" });
  });

  it("should return error when subtask not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "DONE",
    });

    expect(result).toEqual({ error: "Subtask not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const subtask = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(subtask as never);

    const result = await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "DONE",
    });

    expect(result).toEqual({ error: "You don't have permission to update this subtask" });
  });

  it("should update subtask status", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const subtask = createIssue({ project, status: "TODO" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(subtask as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...subtask, status: "DONE" } as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    const result = await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "DONE",
    });

    expect(result.data).toBeDefined();
    expect(db.issue.update).toHaveBeenCalledWith({
      where: { id: VALID_SUBTASK_ID },
      data: { status: "DONE" },
    });
  });

  it("should log status change when status actually changes", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const subtask = createIssue({ project, status: "TODO" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(subtask as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce({ ...subtask, status: "IN_PROGRESS" } as never);
    vi.mocked(db.activity.create).mockResolvedValueOnce({} as never);

    await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "IN_PROGRESS",
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

  it("should NOT log when status is the same", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const subtask = createIssue({ project, status: "TODO" });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(subtask as never);
    vi.mocked(db.issue.update).mockResolvedValueOnce(subtask as never);

    await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "TODO",
    });

    expect(db.activity.create).not.toHaveBeenCalled();
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const subtask = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(subtask as never);
    vi.mocked(db.issue.update).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateSubtaskStatus({
      subtaskId: VALID_SUBTASK_ID,
      status: "DONE",
    });

    expect(result).toEqual({ error: "Failed to update subtask status" });
    consoleSpy.mockRestore();
  });
});

describe("getSubtasksByParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getSubtasksByParent(VALID_PARENT_ID);

    expect(result).toEqual([]);
  });

  it("should return subtasks ordered by status and order", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const subtasks = [
      { id: "1", key: "PROJ-1", title: "Subtask 1", type: "TASK", priority: "MEDIUM", status: "TODO" },
      { id: "2", key: "PROJ-2", title: "Subtask 2", type: "BUG", priority: "HIGH", status: "DONE" },
    ];

    vi.mocked(db.issue.findMany).mockResolvedValueOnce(subtasks as never);

    const result = await getSubtasksByParent(VALID_PARENT_ID);

    expect(result).toEqual(subtasks);
    expect(db.issue.findMany).toHaveBeenCalledWith({
      where: { parentId: VALID_PARENT_ID },
      select: {
        id: true,
        key: true,
        title: true,
        type: true,
        priority: true,
        status: true,
      },
      orderBy: [{ status: "asc" }, { order: "asc" }],
    });
  });
});
