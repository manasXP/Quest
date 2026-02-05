import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvitation } from "@/server/actions/invitation";

type RouteParams = { params: Promise<{ workspaceId: string }> };

// GET /api/workspaces/[workspaceId]/members - List workspace members
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

  return NextResponse.json({ data: workspace.members });
}

// POST /api/workspaces/[workspaceId]/members - Invite a new member
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const result = await createInvitation({ ...body, workspaceId });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Workspace not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
