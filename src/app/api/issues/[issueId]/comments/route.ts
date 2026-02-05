import { NextRequest, NextResponse } from "next/server";
import { getCommentsByIssue, createComment } from "@/server/actions/comment";

type RouteParams = { params: Promise<{ issueId: string }> };

// GET /api/issues/[issueId]/comments - List comments for an issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const comments = await getCommentsByIssue(issueId);

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

// POST /api/issues/[issueId]/comments - Create a new comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const body = await request.json();
    const result = await createComment({ ...body, issueId });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Issue not found" ? 404 :
        result.error.includes("access") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
