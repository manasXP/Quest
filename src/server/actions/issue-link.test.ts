import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIssueLink, deleteIssueLink, getIssueLinks } from "./issue-link";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createIssue, createProject } from "@/test/factories/issue";
import { createIssueLink as createIssueLinkFactory } from "@/test/factories/sprint";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";

// Valid CUID format for testing
const VALID_USER_ID = "clyg7v3qj0001user1234abcd";
const VALID_OWNER_ID = "clyg7v3qj0002ownr1234abcd";
const VALID_ISSUE_FROM_ID = "clyg7v3qj0005isue1234abcd";
const VALID_ISSUE_TO_ID = "clyg7v3qj0006isue1234abcd";
const VALID_LINK_ID = "clyg7v3qj0007link1234abcd";

describe("createIssueLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when linking issue to itself", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_FROM_ID,
    });

    expect(result).toEqual({ error: "Cannot link an issue to itself" });
  });

  it("should return error when source issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result).toEqual({ error: "Source issue not found" });
  });

  it("should return error when user has no access to source issue", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: "clyg7v3qj9999othrownerxyz", members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result).toEqual({ error: "You don't have access to this issue" });
  });

  it("should return error when target issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const fromIssue = createIssue({ project });

    vi.mocked(db.issue.findUnique)
      .mockResolvedValueOnce(fromIssue as never)
      .mockResolvedValueOnce(null);

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result).toEqual({ error: "Target issue not found" });
  });

  it("should return error when link already exists", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const fromIssue = createIssue({ project });
    const toIssue = createIssue({ project });
    const existingLink = createIssueLinkFactory({
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    vi.mocked(db.issue.findUnique)
      .mockResolvedValueOnce(fromIssue as never)
      .mockResolvedValueOnce(toIssue as never);
    vi.mocked(db.issueLink.findUnique).mockResolvedValueOnce(existingLink as never);

    const result = await createIssueLink({
      type: "RELATES_TO",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result).toEqual({ error: "This link already exists" });
  });

  it("should create link successfully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const fromIssue = createIssue({ project });
    const toIssue = createIssue({ project, id: VALID_ISSUE_TO_ID });
    const newLink = createIssueLinkFactory({
      id: VALID_LINK_ID,
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
      type: "BLOCKS",
      toIssue: {
        id: toIssue.id,
        key: toIssue.key,
        title: toIssue.title,
        type: toIssue.type,
        status: toIssue.status,
      },
    });

    vi.mocked(db.issue.findUnique)
      .mockResolvedValueOnce(fromIssue as never)
      .mockResolvedValueOnce(toIssue as never);
    vi.mocked(db.issueLink.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.issueLink.create).mockResolvedValueOnce(newLink as never);

    const result = await createIssueLink({
      type: "BLOCKS",
      fromIssueId: VALID_ISSUE_FROM_ID,
      toIssueId: VALID_ISSUE_TO_ID,
    });

    expect(result.data).toBeDefined();
    expect(db.issueLink.create).toHaveBeenCalledWith({
      data: {
        type: "BLOCKS",
        fromIssueId: VALID_ISSUE_FROM_ID,
        toIssueId: VALID_ISSUE_TO_ID,
      },
      include: {
        toIssue: {
          select: {
            id: true,
            key: true,
            title: true,
            type: true,
            status: true,
          },
        },
      },
    });
  });
});

describe("deleteIssueLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await deleteIssueLink(VALID_LINK_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when link not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issueLink.findUnique).mockResolvedValueOnce(null);

    const result = await deleteIssueLink(VALID_LINK_ID);

    expect(result).toEqual({ error: "Link not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: "clyg7v3qj9999othrownerxyz", members: [] });
    const project = createProject({ workspace });
    const fromIssue = createIssue({ project });
    const link = createIssueLinkFactory({
      id: VALID_LINK_ID,
      fromIssue,
    });

    vi.mocked(db.issueLink.findUnique).mockResolvedValueOnce(link as never);

    const result = await deleteIssueLink(VALID_LINK_ID);

    expect(result).toEqual({ error: "You don't have permission to delete this link" });
  });

  it("should delete link successfully", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const fromIssue = createIssue({ project });
    const link = createIssueLinkFactory({
      id: VALID_LINK_ID,
      fromIssue,
    });

    vi.mocked(db.issueLink.findUnique).mockResolvedValueOnce(link as never);
    vi.mocked(db.issueLink.delete).mockResolvedValueOnce(link as never);

    const result = await deleteIssueLink(VALID_LINK_ID);

    expect(result).toEqual({ success: true });
    expect(db.issueLink.delete).toHaveBeenCalledWith({
      where: { id: VALID_LINK_ID },
    });
  });
});

describe("getIssueLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await getIssueLinks(VALID_ISSUE_FROM_ID);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when issue not found", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });
    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(null);

    const result = await getIssueLinks(VALID_ISSUE_FROM_ID);

    expect(result).toEqual({ error: "Issue not found" });
  });

  it("should return error when user has no access", async () => {
    mockAuthenticatedUser({ id: VALID_USER_ID });

    const workspace = createWorkspace({ ownerId: "clyg7v3qj9999othrownerxyz", members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);

    const result = await getIssueLinks(VALID_ISSUE_FROM_ID);

    expect(result).toEqual({ error: "You don't have access to this issue" });
  });

  it("should return links for issue", async () => {
    mockAuthenticatedUser({ id: VALID_OWNER_ID });

    const workspace = createWorkspace({ ownerId: VALID_OWNER_ID, members: [] });
    const project = createProject({ workspace });
    const issue = createIssue({ project });
    const linksFrom = [createIssueLinkFactory()];
    const linksTo = [createIssueLinkFactory()];

    vi.mocked(db.issue.findUnique).mockResolvedValueOnce(issue as never);
    vi.mocked(db.issueLink.findMany)
      .mockResolvedValueOnce(linksFrom as never)
      .mockResolvedValueOnce(linksTo as never);

    const result = await getIssueLinks(VALID_ISSUE_FROM_ID);

    expect(result.data).toEqual({ linksFrom, linksTo });
    expect(db.issueLink.findMany).toHaveBeenCalledTimes(2);
  });
});
