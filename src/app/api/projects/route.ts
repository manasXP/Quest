import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createProject } from "@/server/actions/project";

// GET /api/projects - List projects (requires workspaceId query param)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId query parameter is required" },
      { status: 400 }
    );
  }

  // Check workspace access
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const hasAccess =
    workspace.ownerId === session.user.id ||
    workspace.members.length > 0;

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to this workspace" },
      { status: 403 }
    );
  }

  const projects = await db.project.findMany({
    where: { workspaceId },
    include: {
      lead: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { issues: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: projects });
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createProject(body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Workspace not found" || result.error === "Project not found" ? 404 :
        result.error.includes("access") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
