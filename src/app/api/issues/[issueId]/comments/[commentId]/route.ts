import { NextRequest, NextResponse } from "next/server";
import { updateComment, deleteComment } from "@/server/actions/comment";

type RouteParams = { params: Promise<{ issueId: string; commentId: string }> };

// PATCH /api/issues/[issueId]/comments/[commentId] - Update a comment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const result = await updateComment(commentId, body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Comment not found" ? 404 :
        result.error.includes("own comments") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/issues/[issueId]/comments/[commentId] - Delete a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { commentId } = await params;
    const result = await deleteComment(commentId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Comment not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
