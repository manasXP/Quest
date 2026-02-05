import { NextRequest, NextResponse } from "next/server";
import { updateSavedFilter, deleteSavedFilter } from "@/server/actions/filter";

type RouteParams = { params: Promise<{ filterId: string }> };

// PATCH /api/filters/[filterId] - Update a saved filter
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { filterId } = await params;
    const body = await request.json();
    const result = await updateSavedFilter(filterId, body);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Filter not found" ? 404 :
        result.error.includes("own filters") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Update filter error:", error);
    return NextResponse.json(
      { error: "Failed to update filter" },
      { status: 500 }
    );
  }
}

// DELETE /api/filters/[filterId] - Delete a saved filter
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { filterId } = await params;
    const result = await deleteSavedFilter(filterId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Filter not found" ? 404 :
        result.error.includes("own filters") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete filter error:", error);
    return NextResponse.json(
      { error: "Failed to delete filter" },
      { status: 500 }
    );
  }
}
