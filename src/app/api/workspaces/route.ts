import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createWorkspace } from "@/server/actions/workspace";

// GET /api/workspaces - List workspaces for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await db.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      _count: {
        select: { projects: true, members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: workspaces });
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createWorkspace(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
