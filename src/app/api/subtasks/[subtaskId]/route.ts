import { NextRequest, NextResponse } from "next/server";
import { updateSubtaskStatus } from "@/server/actions/subtask";

type RouteParams = { params: Promise<{ subtaskId: string }> };

// PATCH /api/subtasks/[subtaskId] - Update subtask status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { subtaskId } = await params;
    const body = await request.json();
    const result = await updateSubtaskStatus({ subtaskId, ...body });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Subtask not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update subtask error:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}
