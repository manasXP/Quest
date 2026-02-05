import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSavedFilter, getSavedFilters } from "@/server/actions/filter";

// GET /api/filters - List saved filters (requires projectId query param)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 }
    );
  }

  const filters = await getSavedFilters(projectId);
  return NextResponse.json({ data: filters });
}

// POST /api/filters - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createSavedFilter(body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Project not found" ? 404 :
        result.error.includes("access") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create filter error:", error);
    return NextResponse.json(
      { error: "Failed to create filter" },
      { status: 500 }
    );
  }
}
