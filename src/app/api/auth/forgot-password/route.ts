import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await requestPasswordReset(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
