import { NextRequest, NextResponse } from "next/server";
import { createSubtask, getSubtasksByParent } from "@/server/actions/subtask";

type RouteParams = { params: Promise<{ issueId: string }> };

// GET /api/issues/[issueId]/subtasks - List subtasks for an issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const subtasks = await getSubtasksByParent(issueId);

    return NextResponse.json({ data: subtasks });
  } catch (error) {
    console.error("Get subtasks error:", error);
    return NextResponse.json(
      { error: "Failed to get subtasks" },
      { status: 500 }
    );
  }
}

// POST /api/issues/[issueId]/subtasks - Create a subtask
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const body = await request.json();
    const result = await createSubtask({ ...body, parentId: issueId });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Parent issue not found" ? 404 :
        result.error.includes("access") || result.error.includes("Cannot create") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create subtask error:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
