"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { respondToInvitation } from "@/server/actions/invitation";
import type { Invitation, User, Workspace, WorkspaceRole } from "@prisma/client";

interface InvitationResponseProps {
  invitation: Invitation & {
    workspace: Pick<Workspace, "id" | "name" | "slug">;
    invitedBy: Pick<User, "id" | "name" | "email" | "image">;
  };
  isExpired: boolean;
  isPending: boolean;
  emailMatches: boolean;
  userEmail: string;
}

const roleLabels: Record<WorkspaceRole, string> = {
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  GUEST: "Guest",
};

export function InvitationResponse({
  invitation,
  isExpired,
  isPending,
  emailMatches,
  userEmail,
}: InvitationResponseProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPendingAction, startTransition] = useTransition();

  const handleResponse = (accept: boolean) => {
    setError(null);

    startTransition(async () => {
      const result = await respondToInvitation({
        token: invitation.token,
        accept,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data && "workspaceSlug" in result.data) {
        setSuccess("You have joined the workspace!");
        setTimeout(() => {
          router.push(`/workspace/${result.data.workspaceSlug}`);
        }, 1500);
      } else {
        setSuccess("You have declined the invitation.");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    });
  };

  // Show error states
  if (isExpired) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation has expired. Please ask{" "}
            {invitation.invitedBy.name || invitation.invitedBy.email} to send a
            new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!isPending) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Invitation No Longer Valid</CardTitle>
          <CardDescription>
            This invitation has already been{" "}
            {invitation.status === "ACCEPTED" ? "accepted" : "declined"}.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!emailMatches) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Email Mismatch</CardTitle>
          <CardDescription>
            This invitation was sent to <strong>{invitation.email}</strong>, but
            you are signed in as <strong>{userEmail}</strong>. Please sign in
            with the correct account.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>{success}</CardTitle>
          <CardDescription>Redirecting...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Join {invitation.workspace.name}</CardTitle>
        <CardDescription>
          {invitation.invitedBy.name || invitation.invitedBy.email} has invited
          you to join this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
          <span className="text-sm">Your role</span>
          <Badge variant="secondary">{roleLabels[invitation.role]}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleResponse(false)}
          disabled={isPendingAction}
        >
          Decline
        </Button>
        <Button
          className="flex-1"
          onClick={() => handleResponse(true)}
          disabled={isPendingAction}
        >
          {isPendingAction ? "Joining..." : "Accept & Join"}
        </Button>
      </CardFooter>
    </Card>
  );
}
