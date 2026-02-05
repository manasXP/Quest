import { NextRequest, NextResponse } from "next/server";
import {
  markNotificationAsRead,
  deleteNotification,
} from "@/server/actions/notification";

type RouteParams = { params: Promise<{ notificationId: string }> };

// PATCH /api/notifications/[notificationId] - Mark a notification as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;
    const result = await markNotificationAsRead(notificationId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Notification not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[notificationId] - Delete a notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;
    const result = await deleteNotification(notificationId);

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 :
        result.error === "Notification not found" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
