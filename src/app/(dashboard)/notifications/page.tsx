import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <NotificationsView />
    </div>
  );
}
