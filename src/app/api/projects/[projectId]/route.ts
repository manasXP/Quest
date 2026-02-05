import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProject, deleteProject } from "@/server/actions/project";

type RouteParams = { params: Promise<{ projectId: string }> };

// GET /api/projects/[projectId] - Get a single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
      lead: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: true,
      _count: {
        select: { issues: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const hasAccess =
    project.workspace.ownerId === session.user.id ||
    project.workspace.members.length > 0;

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to this project" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: project });
}

// PATCH /api/projects/[projectId] - Update a project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const result = await updateProject(projectId, body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Project not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const result = await deleteProject(projectId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Project not found" ? 404 :
        result.error.includes("admin") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
