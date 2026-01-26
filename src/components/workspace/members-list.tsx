"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserMinus, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeMember } from "@/server/actions/invitation";
import type { WorkspaceMember, User, WorkspaceRole } from "@prisma/client";

interface MembersListProps {
  members: (WorkspaceMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  owner: Pick<User, "id" | "name" | "email" | "image">;
  currentUserId: string;
  isOwnerOrAdmin: boolean;
}

const roleLabels: Record<WorkspaceRole, string> = {
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  GUEST: "Guest",
};

export function MembersList({
  members,
  owner,
  currentUserId,
  isOwnerOrAdmin,
}: MembersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this workspace?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result.error) {
        console.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Owner */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={owner.image || undefined} />
            <AvatarFallback>
              {owner.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              {owner.name || "Unknown"}
              {owner.id === currentUserId && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{owner.email}</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Owner
        </Badge>
      </div>

      {/* Members */}
      {members
        .filter((m) => m.userId !== owner.id)
        .map((member) => (
          <div key={member.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.user.image || undefined} />
                <AvatarFallback>
                  {member.user.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  {member.user.name || "Unknown"}
                  {member.userId === currentUserId && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[member.role]}</Badge>
              {isOwnerOrAdmin && member.userId !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        handleRemove(
                          member.id,
                          member.user.name || member.user.email
                        )
                      }
                      disabled={isPending}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove from workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
