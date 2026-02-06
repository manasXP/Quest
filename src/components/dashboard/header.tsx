"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useMobileMenu } from "@/components/dashboard/mobile-menu-context";
import type { User, Workspace } from "@prisma/client";

interface DashboardHeaderProps {
  user: Pick<User, "id" | "name" | "email" | "image">;
  workspaces: Workspace[];
}

export function DashboardHeader({
  user,
  workspaces,
}: DashboardHeaderProps) {
  const { menuContent } = useMobileMenu();

  return (
    <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-50">
      {/* Safe area padding for iOS notch */}
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center gap-2 px-4">
          {/* Mobile menu - from workspace context */}
          {menuContent ? (
            <div className="md:hidden">{menuContent}</div>
          ) : null}

          {/* Quest logo - hidden on mobile when menu is present */}
          <Link
            href="/workspace"
            className={`font-bold text-xl ${menuContent ? 'hidden md:block' : ''}`}
          >
            Quest
          </Link>

          <div className="w-48 hidden sm:block">
            <WorkspaceSwitcher workspaces={workspaces} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
