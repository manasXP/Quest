import { NextRequest, NextResponse } from "next/server";
import { respondToInvitation } from "@/server/actions/invitation";

type RouteParams = { params: Promise<{ token: string }> };

// POST /api/invitations/[token] - Accept or decline an invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const result = await respondToInvitation({ token, accept: body.accept });

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Invitation not found" ? 404 :
        result.error.includes("different email") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Respond to invitation error:", error);
    return NextResponse.json(
      { error: "Failed to respond to invitation" },
      { status: 500 }
    );
  }
}
