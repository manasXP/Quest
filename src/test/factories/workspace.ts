let workspaceCounter = 0;
let memberCounter = 0;

export function createWorkspace(overrides: Partial<{
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members: ReturnType<typeof createWorkspaceMember>[];
}> = {}) {
  workspaceCounter++;
  return {
    id: `cuid-workspace-${workspaceCounter}`,
    name: `Test Workspace ${workspaceCounter}`,
    slug: `test-workspace-${workspaceCounter}`,
    ownerId: `cuid-owner-${workspaceCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [],
    ...overrides,
  };
}

export function createWorkspaceMember(overrides: Partial<{
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "DEVELOPER" | "TESTER" | "GUEST";
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  memberCounter++;
  return {
    id: `cuid-member-${memberCounter}`,
    userId: `cuid-user-${memberCounter}`,
    workspaceId: `cuid-workspace-${memberCounter}`,
    role: "DEVELOPER" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetWorkspaceCounter() {
  workspaceCounter = 0;
  memberCounter = 0;
}
