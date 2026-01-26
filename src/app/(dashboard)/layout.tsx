import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspaces } from "@/server/queries/workspace";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const workspaces = await getWorkspaces();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader
        user={{
          id: session.user.id,
          name: session.user.name || null,
          email: session.user.email || "",
          image: session.user.image || null,
        }}
        workspaces={workspaces}
      />
      {children}
    </div>
  );
}
