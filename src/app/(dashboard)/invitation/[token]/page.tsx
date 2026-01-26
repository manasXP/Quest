import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInvitationByToken } from "@/server/queries/invitation";
import { InvitationResponse } from "./invitation-response";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  // Check if invitation is still valid
  const isExpired = new Date() > invitation.expiresAt;
  const isPending = invitation.status === "PENDING";
  const emailMatches =
    invitation.email.toLowerCase() === session.user.email?.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <InvitationResponse
        invitation={invitation}
        isExpired={isExpired}
        isPending={isPending}
        emailMatches={emailMatches}
        userEmail={session.user.email || ""}
      />
    </div>
  );
}
