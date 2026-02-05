import { NextRequest, NextResponse } from "next/server";
import { cancelInvitation } from "@/server/actions/invitation";

type RouteParams = { params: Promise<{ invitationId: string }> };

// DELETE /api/invitations/[invitationId]/cancel - Cancel an invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { invitationId } = await params;
    const result = await cancelInvitation(invitationId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Invitation not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
