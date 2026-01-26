import { createWorkspace } from "./workspace";

let invitationCounter = 0;

export function createInvitation(overrides: Partial<{
  id: string;
  token: string;
  email: string;
  role: "ADMIN" | "DEVELOPER" | "TESTER" | "GUEST";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  workspaceId: string;
  invitedById: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  workspace?: ReturnType<typeof createWorkspace>;
}> = {}) {
  invitationCounter++;
  const workspace = overrides.workspace ?? createWorkspace();
  return {
    id: `cuid-invitation-${invitationCounter}`,
    token: `cuid-token-${invitationCounter}`,
    email: `invited${invitationCounter}@test.com`,
    role: "DEVELOPER" as const,
    status: "PENDING" as const,
    workspaceId: workspace.id,
    invitedById: workspace.ownerId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace,
    ...overrides,
  };
}

export function createExpiredInvitation(overrides: Partial<Parameters<typeof createInvitation>[0]> = {}) {
  return createInvitation({
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    ...overrides,
  });
}

export function resetInvitationCounter() {
  invitationCounter = 0;
}
