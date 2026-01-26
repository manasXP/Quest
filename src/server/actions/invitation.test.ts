import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInvitation,
  respondToInvitation,
  cancelInvitation,
  removeMember,
} from "./invitation";
import { db } from "@/lib/db";
import { mockAuthenticatedUser, mockUnauthenticated } from "@/test/mocks/auth";
import { createWorkspace, createWorkspaceMember } from "@/test/factories/workspace";
import { createInvitation as createInvitationFactory, createExpiredInvitation } from "@/test/factories/invitation";
import { createUser } from "@/test/factories/user";

describe("createInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for invalid email", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await createInvitation({
      email: "invalid-email",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Invalid email address" });
  });

  it("should return error for invalid workspaceId", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "invalid-id",
    });

    expect(result).toEqual({ error: "Invalid workspace ID" });
  });

  it("should return error when workspace not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(null);

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Workspace not found" });
  });

  it("should return error when user is not owner or admin", async () => {
    mockAuthenticatedUser({ id: "regular-user" });

    const workspace = createWorkspace({
      ownerId: "owner-1",
      members: [createWorkspaceMember({ userId: "regular-user", role: "DEVELOPER" })],
    });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "You don't have permission to invite members" });
  });

  it("should allow workspace owner to invite", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(null);

    const invitation = createInvitationFactory({ email: "test@example.com", workspace });
    vi.mocked(db.invitation.create).mockResolvedValueOnce(invitation as never);

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result.data).toBeDefined();
  });

  it("should allow admin to invite", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [adminMember] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(null);

    const invitation = createInvitationFactory({ email: "test@example.com", workspace });
    vi.mocked(db.invitation.create).mockResolvedValueOnce(invitation as never);

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result.data).toBeDefined();
  });

  it("should return error if user is already a member", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);

    const existingMember = createWorkspaceMember();
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(existingMember as never);

    const result = await createInvitation({
      email: "existing@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "This user is already a member of this workspace" });
  });

  it("should return error if pending invitation exists", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);

    const existingInvitation = createInvitationFactory({ status: "PENDING" });
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(existingInvitation as never);

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "An invitation has already been sent to this email" });
  });

  it("should set 7-day expiry on invitation", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(null);

    const invitation = createInvitationFactory({ workspace });
    vi.mocked(db.invitation.create).mockResolvedValueOnce(invitation as never);

    await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(db.invitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: expect.any(Date),
      }),
    });

    // Verify the expiry is approximately 7 days from now
    const createCall = vi.mocked(db.invitation.create).mock.calls[0][0];
    const expiresAt = createCall.data.expiresAt as Date;
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeCloseTo(sevenDaysFromNow, -4); // Within ~10 seconds
  });

  it("should default role to DEVELOPER", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(null);

    const invitation = createInvitationFactory({ workspace });
    vi.mocked(db.invitation.create).mockResolvedValueOnce(invitation as never);

    await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(db.invitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "DEVELOPER",
      }),
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    vi.mocked(db.workspace.findUnique).mockResolvedValueOnce(workspace as never);
    vi.mocked(db.workspaceMember.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.invitation.create).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createInvitation({
      email: "test@example.com",
      workspaceId: "clyg7v3qj0000abcd1234efgh",
    });

    expect(result).toEqual({ error: "Failed to create invitation" });
    consoleSpy.mockRestore();
  });
});

describe("respondToInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error for invalid token", async () => {
    mockAuthenticatedUser({ id: "user-1" });

    const result = await respondToInvitation({
      token: "invalid-token",
      accept: true,
    });

    expect(result).toEqual({ error: "Invalid invitation token" });
  });

  it("should return error when invitation not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(null);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "Invitation not found" });
  });

  it("should return error for non-pending invitation", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "user@test.com" });

    const invitation = createInvitationFactory({ status: "ACCEPTED" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "This invitation is no longer valid" });
  });

  it("should return error for expired invitation", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "invited@test.com" });

    const expiredInvitation = createExpiredInvitation({ email: "invited@test.com" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(expiredInvitation as never);
    vi.mocked(db.invitation.update).mockResolvedValueOnce({} as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "This invitation has expired" });
    expect(db.invitation.update).toHaveBeenCalledWith({
      where: { id: expiredInvitation.id },
      data: { status: "EXPIRED" },
    });
  });

  it("should return error when email does not match", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "different@test.com" });

    const invitation = createInvitationFactory({ email: "invited@test.com" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "This invitation was sent to a different email address" });
  });

  it("should create membership when accepting invitation", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "invited@test.com" });

    const workspace = createWorkspace();
    const invitation = createInvitationFactory({
      email: "invited@test.com",
      workspace,
      role: "DEVELOPER",
    });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.$transaction).mockResolvedValueOnce([{}, {}] as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result.data).toEqual({ workspaceSlug: workspace.slug });
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("should handle case-insensitive email matching", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "INVITED@TEST.COM" });

    const workspace = createWorkspace();
    const invitation = createInvitationFactory({
      email: "invited@test.com",
      workspace,
    });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.$transaction).mockResolvedValueOnce([{}, {}] as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result.data).toEqual({ workspaceSlug: workspace.slug });
  });

  it("should reject invitation when accept is false", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "invited@test.com" });

    const invitation = createInvitationFactory({ email: "invited@test.com" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.invitation.update).mockResolvedValueOnce({} as never);

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: false,
    });

    expect(result.data).toEqual({ rejected: true });
    expect(db.invitation.update).toHaveBeenCalledWith({
      where: { id: invitation.id },
      data: { status: "REJECTED" },
    });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "user-1", email: "invited@test.com" });

    const invitation = createInvitationFactory({ email: "invited@test.com" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await respondToInvitation({
      token: "clyg7v3qj0000abcd1234efgh",
      accept: true,
    });

    expect(result).toEqual({ error: "Failed to respond to invitation" });
    consoleSpy.mockRestore();
  });
});

describe("cancelInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when invitation not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(null);

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ error: "Invitation not found" });
  });

  it("should allow owner to cancel invitation", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const invitation = createInvitationFactory({ workspace, invitedById: "other-user" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.invitation.delete).mockResolvedValueOnce(invitation as never);

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ success: true });
  });

  it("should allow admin to cancel invitation", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [adminMember] });
    const invitation = createInvitationFactory({ workspace, invitedById: "other-user" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.invitation.delete).mockResolvedValueOnce(invitation as never);

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ success: true });
  });

  it("should allow sender to cancel their own invitation", async () => {
    mockAuthenticatedUser({ id: "sender-1" });

    const devMember = createWorkspaceMember({ userId: "sender-1", role: "DEVELOPER" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [devMember] });
    const invitation = createInvitationFactory({ workspace, invitedById: "sender-1" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.invitation.delete).mockResolvedValueOnce(invitation as never);

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ success: true });
  });

  it("should deny non-owner non-admin non-sender from canceling", async () => {
    mockAuthenticatedUser({ id: "random-user" });

    const devMember = createWorkspaceMember({ userId: "random-user", role: "DEVELOPER" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [devMember] });
    const invitation = createInvitationFactory({ workspace, invitedById: "other-user" });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ error: "You don't have permission to cancel this invitation" });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const invitation = createInvitationFactory({ workspace });
    vi.mocked(db.invitation.findUnique).mockResolvedValueOnce(invitation as never);
    vi.mocked(db.invitation.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await cancelInvitation("invitation-1");

    expect(result).toEqual({ error: "Failed to cancel invitation" });
    consoleSpy.mockRestore();
  });
});

describe("removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not authenticated", async () => {
    mockUnauthenticated();

    const result = await removeMember("member-1");

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should return error when member not found", async () => {
    mockAuthenticatedUser({ id: "user-1" });
    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce(null);

    const result = await removeMember("member-1");

    expect(result).toEqual({ error: "Member not found" });
  });

  it("should not allow removing the workspace owner", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const user = createUser({ id: "owner-1" });
    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [adminMember] });
    const ownerMember = createWorkspaceMember({
      userId: "owner-1",
      workspaceId: workspace.id,
    });

    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      ...ownerMember,
      workspace,
      user,
    } as never);

    const result = await removeMember("owner-member-id");

    expect(result).toEqual({ error: "Cannot remove the workspace owner" });
  });

  it("should allow owner to remove members", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const user = createUser({ id: "member-1" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const memberToRemove = createWorkspaceMember({
      userId: "member-1",
      workspaceId: workspace.id,
    });

    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      ...memberToRemove,
      workspace,
      user,
    } as never);
    vi.mocked(db.workspaceMember.delete).mockResolvedValueOnce(memberToRemove as never);

    const result = await removeMember("member-to-remove");

    expect(result).toEqual({ success: true });
  });

  it("should allow admin to remove members", async () => {
    mockAuthenticatedUser({ id: "admin-1" });

    const user = createUser({ id: "member-1" });
    const adminMember = createWorkspaceMember({ userId: "admin-1", role: "ADMIN" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [adminMember] });
    const memberToRemove = createWorkspaceMember({
      userId: "member-1",
      workspaceId: workspace.id,
    });

    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      ...memberToRemove,
      workspace,
      user,
    } as never);
    vi.mocked(db.workspaceMember.delete).mockResolvedValueOnce(memberToRemove as never);

    const result = await removeMember("member-to-remove");

    expect(result).toEqual({ success: true });
  });

  it("should deny non-owner non-admin from removing members", async () => {
    mockAuthenticatedUser({ id: "regular-member" });

    const user = createUser({ id: "target-member" });
    const regularMember = createWorkspaceMember({ userId: "regular-member", role: "DEVELOPER" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [regularMember] });
    const memberToRemove = createWorkspaceMember({
      userId: "target-member",
      workspaceId: workspace.id,
    });

    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      ...memberToRemove,
      workspace,
      user,
    } as never);

    const result = await removeMember("member-to-remove");

    expect(result).toEqual({ error: "You don't have permission to remove members" });
  });

  it("should handle database error gracefully", async () => {
    mockAuthenticatedUser({ id: "owner-1" });

    const user = createUser({ id: "member-1" });
    const workspace = createWorkspace({ ownerId: "owner-1", members: [] });
    const memberToRemove = createWorkspaceMember({
      userId: "member-1",
      workspaceId: workspace.id,
    });

    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      ...memberToRemove,
      workspace,
      user,
    } as never);
    vi.mocked(db.workspaceMember.delete).mockRejectedValueOnce(new Error("DB Error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await removeMember("member-to-remove");

    expect(result).toEqual({ error: "Failed to remove member" });
    consoleSpy.mockRestore();
  });
});
