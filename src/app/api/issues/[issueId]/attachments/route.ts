import { NextRequest, NextResponse } from "next/server";
import { getAttachmentsByIssue } from "@/server/actions/attachment";

type RouteParams = { params: Promise<{ issueId: string }> };

// GET /api/issues/[issueId]/attachments - List attachments for an issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const attachments = await getAttachmentsByIssue(issueId);

    return NextResponse.json({ data: attachments });
  } catch (error) {
    console.error("Get attachments error:", error);
    return NextResponse.json(
      { error: "Failed to get attachments" },
      { status: 500 }
    );
  }
}
