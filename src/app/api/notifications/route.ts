import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "@/server/actions/notification";

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const countOnly = searchParams.get("countOnly") === "true";

  if (countOnly) {
    const count = await getUnreadNotificationCount();
    return NextResponse.json({ data: { unreadCount: count } });
  }

  const notifications = await getNotifications(limit);
  return NextResponse.json({ data: notifications });
}

// POST /api/notifications - Mark all notifications as read
export async function POST() {
  try {
    const result = await markAllNotificationsAsRead();

    if (result.error) {
      const status = result.error === "Unauthorized" ? 401 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
