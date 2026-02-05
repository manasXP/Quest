import { NextRequest, NextResponse } from "next/server";
import { removeMember } from "@/server/actions/invitation";

type RouteParams = { params: Promise<{ workspaceId: string; memberId: string }> };

// DELETE /api/workspaces/[workspaceId]/members/[memberId] - Remove a member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { memberId } = await params;
    const result = await removeMember(memberId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Member not found" ? 404 :
        result.error.includes("permission") || result.error.includes("Cannot remove") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
