import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/server/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await resetPassword(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
