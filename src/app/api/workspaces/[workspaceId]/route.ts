import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateWorkspace, deleteWorkspace } from "@/server/actions/workspace";

type RouteParams = { params: Promise<{ workspaceId: string }> };

// GET /api/workspaces/[workspaceId] - Get a single workspace
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      projects: {
        select: { id: true, name: true, key: true },
      },
      _count: {
        select: { projects: true, members: true },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Check access
  const hasAccess =
    workspace.ownerId === session.user.id ||
    workspace.members.some((m) => m.userId === session.user.id);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to this workspace" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: workspace });
}

// PATCH /api/workspaces/[workspaceId] - Update a workspace
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const result = await updateWorkspace(workspaceId, body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Workspace not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update workspace error:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId] - Delete a workspace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const result = await deleteWorkspace(workspaceId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Workspace not found" ? 404 :
        result.error.includes("owner") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
