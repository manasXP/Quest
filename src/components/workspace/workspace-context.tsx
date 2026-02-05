"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Workspace, Project } from "@prisma/client";

type WorkspaceWithProjects = Workspace & { projects: Project[] };

const WorkspaceContext = createContext<WorkspaceWithProjects | null>(null);

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: WorkspaceWithProjects;
  children: ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
