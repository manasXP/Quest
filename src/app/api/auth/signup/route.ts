import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/server/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await signUp(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
