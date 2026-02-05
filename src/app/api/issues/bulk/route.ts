import { NextRequest, NextResponse } from "next/server";
import {
  bulkUpdateStatus,
  bulkAssign,
  bulkUpdatePriority,
  bulkDelete,
} from "@/server/actions/bulk";

// POST /api/issues/bulk - Perform bulk operations on issues
// Request body should include { action: string, ...actionData }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case "updateStatus":
        result = await bulkUpdateStatus(data);
        break;
      case "assign":
        result = await bulkAssign(data);
        break;
      case "updatePriority":
        result = await bulkUpdatePriority(data);
        break;
      case "delete":
        result = await bulkDelete(data);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: updateStatus, assign, updatePriority, delete` },
          { status: 400 }
        );
    }

    if ("error" in result && result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error.includes("not found") ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
