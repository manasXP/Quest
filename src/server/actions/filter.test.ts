import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  getSavedFilters,
  getDefaultFilter,
} from "./filter";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createProject } from "@/test/factories/issue";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";
import { createSavedFilter as createSavedFilterFactory } from "@/test/factories/filter";

const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_PROJECT_ID = "clyg7v3qj0003proj1234abcd";
const VALID_FILTER_ID = "clyg7v3qj0004fltr1234abcd";

describe("createSavedFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createSavedFilter({
      name: "Test Filter",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for empty name", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createSavedFilter({
      name: "",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Name is required" });
  });

  it("should return error for invalid projectId", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createSavedFilter({
      name: "Test Filter",
      filters: {},
      projectId: "invalid-id",
    });

    expect(result).toEqual({ error: "Invalid project ID" });
  });

  it("should return error when project not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.project.findUnique).mockResolvedValueOnce(null);

    const result = await createSavedFilter({
      name: "Test Filter",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Project not found" });
  });

  it("should return error when user has no access to project", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009noaccess0001" });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);

    const result = await createSavedFilter({
      name: "Test Filter",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "You don't have access to this project" });
  });

  it("should create saved filter when user is workspace owner", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);

    const createdFilter = createSavedFilterFactory({
      name: "My Filter",
      filters: { status: ["TODO"] },
    });
    vi.mocked(db.savedFilter.create).mockResolvedValueOnce(createdFilter as never);

    const result = await createSavedFilter({
      name: "My Filter",
      filters: { status: ["TODO"] },
      projectId: VALID_PROJECT_ID,
    });

    expect(result.data).toBeDefined();
    expect(db.savedFilter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "My Filter",
        userId: VALID_OWNER_ID,
        isDefault: false,
      }),
    });
  });

  it("should create saved filter when user is workspace member", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const member = createWorkspaceMember({ userId: VALID_USER_ID });
    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [member] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);

    const createdFilter = createSavedFilterFactory();
    vi.mocked(db.savedFilter.create).mockResolvedValueOnce(createdFilter as never);

    const result = await createSavedFilter({
      name: "Member Filter",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result.data).toBeDefined();
  });

  it("should unset other default filters when creating a new default", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.savedFilter.updateMany).mockResolvedValueOnce({ count: 1 } as never);

    const createdFilter = createSavedFilterFactory({ isDefault: true });
    vi.mocked(db.savedFilter.create).mockResolvedValueOnce(createdFilter as never);

    await createSavedFilter({
      name: "New Default",
      filters: {},
      projectId: VALID_PROJECT_ID,
      isDefault: true,
    });

    expect(db.savedFilter.updateMany).toHaveBeenCalledWith({
      where: {
        projectId: VALID_PROJECT_ID,
        userId: VALID_OWNER_ID,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  });

  it("should return error for duplicate filter name", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.savedFilter.create).mockRejectedValueOnce({ code: "P2002" });

    const result = await createSavedFilter({
      name: "Duplicate Name",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "A filter with this name already exists" });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });

    vi.mocked(db.project.findUnique).mockResolvedValueOnce(project as never);
    vi.mocked(db.savedFilter.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createSavedFilter({
      name: "Test",
      filters: {},
      projectId: VALID_PROJECT_ID,
    });

    expect(result).toEqual({ error: "Failed to save filter" });
    consoleSpy.mockRestore();
  });
});

describe("updateSavedFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await updateSavedFilter(VALID_FILTER_ID, { name: "Updated" });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when filter not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(null);

    const result = await updateSavedFilter(VALID_FILTER_ID, { name: "Updated" });

    expect(result).toEqual({ error: "Filter not found" });
  });

  it("should return error when updating another user's filter", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009other1234abc" });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);

    const result = await updateSavedFilter(VALID_FILTER_ID, { name: "Updated" });

    expect(result).toEqual({ error: "You can only update your own filters" });
  });

  it("should update filter name", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);

    const updatedFilter = { ...existingFilter, name: "Updated Name" };
    vi.mocked(db.savedFilter.update).mockResolvedValueOnce(updatedFilter as never);

    const result = await updateSavedFilter(VALID_FILTER_ID, { name: "Updated Name" });

    expect(result.data).toBeDefined();
    expect(db.savedFilter.update).toHaveBeenCalledWith({
      where: { id: VALID_FILTER_ID },
      data: { name: "Updated Name" },
    });
  });

  it("should unset other defaults when setting as default", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const existingFilter = createSavedFilterFactory({
      id: VALID_FILTER_ID,
      userId: VALID_USER_ID,
      projectId: VALID_PROJECT_ID,
      project: {
        id: VALID_PROJECT_ID,
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);
    vi.mocked(db.savedFilter.updateMany).mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(db.savedFilter.update).mockResolvedValueOnce({ ...existingFilter, isDefault: true } as never);

    await updateSavedFilter(VALID_FILTER_ID, { isDefault: true });

    expect(db.savedFilter.updateMany).toHaveBeenCalledWith({
      where: {
        projectId: VALID_PROJECT_ID,
        userId: VALID_USER_ID,
        isDefault: true,
        id: { not: VALID_FILTER_ID },
      },
      data: { isDefault: false },
    });
  });

  it("should return error for duplicate name on update", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);
    vi.mocked(db.savedFilter.update).mockRejectedValueOnce({ code: "P2002" });

    const result = await updateSavedFilter(VALID_FILTER_ID, { name: "Duplicate" });

    expect(result).toEqual({ error: "A filter with this name already exists" });
  });
});

describe("deleteSavedFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteSavedFilter(VALID_FILTER_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when filter not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(null);

    const result = await deleteSavedFilter(VALID_FILTER_ID);

    expect(result).toEqual({ error: "Filter not found" });
  });

  it("should return error when deleting another user's filter", async () => {
    mockAuthenticatedUser({ id: "clyg7v3qj0009other1234abc" });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);

    const result = await deleteSavedFilter(VALID_FILTER_ID);

    expect(result).toEqual({ error: "You can only delete your own filters" });
  });

  it("should delete filter successfully", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);
    vi.mocked(db.savedFilter.delete).mockResolvedValueOnce(existingFilter as never);

    const result = await deleteSavedFilter(VALID_FILTER_ID);

    expect(result).toEqual({ success: true });
    expect(db.savedFilter.delete).toHaveBeenCalledWith({
      where: { id: VALID_FILTER_ID },
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const existingFilter = createSavedFilterFactory({
      userId: VALID_USER_ID,
      project: {
        id: "proj-1",
        key: "PROJ",
        workspace: { slug: "test", ownerId: VALID_OWNER_ID },
      },
    });

    vi.mocked(db.savedFilter.findUnique).mockResolvedValueOnce(existingFilter as never);
    vi.mocked(db.savedFilter.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteSavedFilter(VALID_FILTER_ID);

    expect(result).toEqual({ error: "Failed to delete filter" });
    consoleSpy.mockRestore();
  });
});

describe("getSavedFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getSavedFilters(VALID_PROJECT_ID);

    expect(result).toEqual([]);
  });

  it("should return filters ordered by isDefault and name", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const filters = [
      createSavedFilterFactory({ name: "Default", isDefault: true }),
      createSavedFilterFactory({ name: "Alpha" }),
      createSavedFilterFactory({ name: "Beta" }),
    ];

    vi.mocked(db.savedFilter.findMany).mockResolvedValueOnce(filters as never);

    const result = await getSavedFilters(VALID_PROJECT_ID);

    expect(result).toEqual(filters);
    expect(db.savedFilter.findMany).toHaveBeenCalledWith({
      where: {
        projectId: VALID_PROJECT_ID,
        userId: VALID_USER_ID,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  });
});

describe("getDefaultFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getDefaultFilter(VALID_PROJECT_ID);

    expect(result).toBeNull();
  });

  it("should return default filter", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const defaultFilter = createSavedFilterFactory({ isDefault: true });
    vi.mocked(db.savedFilter.findFirst).mockResolvedValueOnce(defaultFilter as never);

    const result = await getDefaultFilter(VALID_PROJECT_ID);

    expect(result).toEqual(defaultFilter);
    expect(db.savedFilter.findFirst).toHaveBeenCalledWith({
      where: {
        projectId: VALID_PROJECT_ID,
        userId: VALID_USER_ID,
        isDefault: true,
      },
    });
  });

  it("should return null when no default filter exists", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.savedFilter.findFirst).mockResolvedValueOnce(null);

    const result = await getDefaultFilter(VALID_PROJECT_ID);

    expect(result).toBeNull();
  });
});
