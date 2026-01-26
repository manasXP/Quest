"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelInvitation } from "@/server/actions/invitation";
import type { Invitation, User, WorkspaceRole } from "@prisma/client";

interface PendingInvitationsProps {
  invitations: (Invitation & {
    invitedBy: Pick<User, "id" | "name" | "email" | "image">;
  })[];
}

const roleLabels: Record<WorkspaceRole, string> = {
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  GUEST: "Guest",
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    startTransition(async () => {
      const result = await cancelInvitation(invitationId);
      if (result.error) {
        console.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Pending Invitations ({invitations.length})
      </h3>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">
                  Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCancel(invitation.id)}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
