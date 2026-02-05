import { NextRequest, NextResponse } from "next/server";
import { getActivitiesByIssue } from "@/server/actions/activity";

type RouteParams = { params: Promise<{ issueId: string }> };

// GET /api/issues/[issueId]/activity - List activity for an issue
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params;
    const activities = await getActivitiesByIssue(issueId);

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json(
      { error: "Failed to get activity" },
      { status: 500 }
    );
  }
}
