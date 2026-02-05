import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateIssue, deleteIssue, moveIssue } from "@/server/actions/issue";

type RouteParams = { params: Promise<{ issueId: string }> };

// GET /api/issues/[issueId] - Get a single issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { issueId } = await params;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: session.user.id },
              },
            },
          },
        },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      reporter: {
        select: { id: true, name: true, email: true, image: true },
      },
      labels: {
        include: { label: true },
      },
      subtasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      parent: {
        select: { id: true, key: true, title: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: {
          uploader: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { subtasks: true, comments: true, attachments: true },
      },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const hasAccess =
    issue.project.workspace.ownerId === session.user.id ||
    issue.project.workspace.members.length > 0;

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You don't have access to this issue" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: issue });
}

// PATCH /api/issues/[issueId] - Update an issue
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const body = await request.json();
    const result = await updateIssue(issueId, body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Issue not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update issue error:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[issueId] - Delete an issue
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const result = await deleteIssue(issueId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Issue not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete issue error:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}

// POST /api/issues/[issueId]/move - Move an issue (change status/order)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const body = await request.json();
    const result = await moveIssue({ issueId, ...body });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Issue not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Move issue error:", error);
    return NextResponse.json(
      { error: "Failed to move issue" },
      { status: 500 }
    );
  }
}
