"use client";

import { useEffect } from "react";
import { useMobileMenu } from "@/components/dashboard/mobile-menu-context";
import { MobileSidebarTrigger } from "@/components/workspace/workspace-sidebar";
import type { Workspace, Project } from "@prisma/client";

interface WorkspaceMobileMenuProps {
  workspace: Workspace & { projects: Project[] };
}

export function WorkspaceMobileMenu({ workspace }: WorkspaceMobileMenuProps) {
  const { setMenuContent } = useMobileMenu();

  useEffect(() => {
    setMenuContent(<MobileSidebarTrigger workspace={workspace} />);

    return () => {
      setMenuContent(null);
    };
  }, [workspace, setMenuContent]);

  return null;
}
