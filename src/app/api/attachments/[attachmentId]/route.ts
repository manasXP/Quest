import { NextRequest, NextResponse } from "next/server";
import { deleteAttachment } from "@/server/actions/attachment";

type RouteParams = { params: Promise<{ attachmentId: string }> };

// DELETE /api/attachments/[attachmentId] - Delete an attachment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { attachmentId } = await params;
    const result = await deleteAttachment(attachmentId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Attachment not found" ? 404 :
        result.error.includes("permission") ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
