import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createIssue } from "@/server/actions/issue";

// GET /api/issues - List issues (requires projectId query param)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 }
    );
  }

  // Check project access
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

  // Build filter
  const where: Record<string, unknown> = { projectId };
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId === "unassigned" ? null : assigneeId;
  if (priority) where.priority = priority;
  if (type) where.type = type;

  const issues = await db.issue.findMany({
    where,
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      reporter: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      _count: {
        select: { subtasks: true, comments: true, attachments: true },
      },
    },
    orderBy: [{ status: "asc" }, { order: "asc" }],
  });

  return NextResponse.json({ data: issues });
}

// POST /api/issues - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createIssue(body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Project not found" ? 404 :
        result.error.includes("access") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
