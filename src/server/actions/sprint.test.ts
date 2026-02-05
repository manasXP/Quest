import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSprint, updateSprint, deleteSprint, getProjectSprints } from "./sprint";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createProject } from "@/test/factories/issue";
import { createSprint as createSprintFactory } from "@/test/factories/sprint";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

// Valid CUID format for testing
const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_PROJECT_ID = "clyg7v3qj0004proj1234abcd";
const VALID_SPRINT_ID = "clyg7v3qj0006sprt1234abcd";

describe("createSprint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when project not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Project not found" });
  });

  it("should return error when user has no access to project", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: "clyg7v3qj9999othrownerxyz", members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "You don't have access to this project" });
  });

  it("should return error when sprint name already exists", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(createSprintFactory() as never);

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "A sprint with this name already exists in this project" });
  });

  it("should create sprint successfully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const newSprint = createSprintFactory({ id: VALID_SPRINT_ID, projectId: project.id });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.sprint.create).mockResolvedValueOnce(newSprint as never);

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result.data).toBeDefined();
    expect(db.sprint.create).toHaveBeenCalledWith({
      data: {
        name: "Sprint 1",
        goal: undefined,
        startDate: undefined,
        endDate: undefined,
        projectId: VALID_PROJECT_ID,
      },
    });
  });

  it("should allow workspace member to create sprint", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID });
    const member = createWorkspaceMember({ userId: VALID_USER_ID });
    const project = createProject({
      workspace: { ...workspace, members: [member] },
    });
    const newSprint = createSprintFactory({ projectId: project.id });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.sprint.create).mockResolvedValueOnce(newSprint as never);

    const result = await createSprint({
      name: "Sprint 1",
      projectId: VALID_PROJECT_ID,
    });

    expect(result.data).toBeDefined();
  });
});

describe("updateSprint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await updateSprint(VALID_SPRINT_ID, { name: "Updated Sprint" });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when sprint not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(null);

    const result = await updateSprint(VALID_SPRINT_ID, { name: "Updated Sprint" });

    expect(result).toEqual({ error: "Sprint not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: "clyg7v3qj9999othrownerxyz", members: [] });
    const project = createProject({ workspace });
    const sprint = createSprintFactory({ id: VALID_SPRINT_ID, project });

    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(sprint as never);

    const result = await updateSprint(VALID_SPRINT_ID, { name: "Updated Sprint" });

    expect(result).toEqual({ error: "You don't have permission to update this sprint" });
  });

  it("should update sprint successfully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const sprint = createSprintFactory({ id: VALID_SPRINT_ID, project });
    const updatedSprint = { ...sprint, name: "Updated Sprint", status: "ACTIVE" as const };

    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(sprint as never);
    vi.mocked(db.sprint.update).mockResolvedValueOnce(updatedSprint as never);

    const result = await updateSprint(VALID_SPRINT_ID, {
      name: "Updated Sprint",
      status: "ACTIVE",
    });

    expect(result.data).toEqual(updatedSprint);
  });

  it("should return error when updating to duplicate name", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const sprint = createSprintFactory({ id: VALID_SPRINT_ID, project, name: "Sprint 1" });
    const existingSprint = createSprintFactory({ project, name: "Sprint 2" });

    vi.mocked(db.sprint.findUnique)
      .mockResolvedValueOnce(sprint as never)
      .mockResolvedValueOnce(existingSprint as never);

    const result = await updateSprint(VALID_SPRINT_ID, { name: "Sprint 2" });

    expect(result).toEqual({ error: "A sprint with this name already exists" });
  });
});

describe("deleteSprint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteSprint(VALID_SPRINT_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when sprint not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(null);

    const result = await deleteSprint(VALID_SPRINT_ID);

    expect(result).toEqual({ error: "Sprint not found" });
  });

  it("should delete sprint successfully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const sprint = createSprintFactory({ id: VALID_SPRINT_ID, project });

    vi.mocked(db.sprint.findUnique).mockResolvedValueOnce(sprint as never);
    vi.mocked(db.sprint.delete).mockResolvedValueOnce(sprint as never);

    const result = await deleteSprint(VALID_SPRINT_ID);

    expect(result).toEqual({ success: true });
    expect(db.sprint.delete).toHaveBeenCalledWith({
      where: { id: VALID_SPRINT_ID },
    });
  });
});

describe("getProjectSprints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getProjectSprints(VALID_PROJECT_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when project not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);

    const result = await getProjectSprints(VALID_PROJECT_ID);

    expect(result).toEqual({ error: "Project not found" });
  });

  it("should return sprints for project", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const sprints = [
      createSprintFactory({ projectId: project.id, name: "Sprint 1" }),
      createSprintFactory({ projectId: project.id, name: "Sprint 2" }),
    ];

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.sprint.findMany).mockResolvedValueOnce(sprints as never);

    const result = await getProjectSprints(VALID_PROJECT_ID);

    expect(result.data).toHaveLength(2);
  });
});
