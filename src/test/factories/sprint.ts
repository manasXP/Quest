import { createProject } from "./issue";

let sprintCounter = 0;

export function createSprint(overrides: Partial<{
  id: string;
  name: string;
  goal: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: ReturnType<typeof createProject>;
}> = {}) {
  sprintCounter++;
  const project = overrides.project ?? createProject();
  return {
    id: `cuid-sprint-${sprintCounter}`,
    name: `Sprint ${sprintCounter}`,
    goal: null,
    startDate: null,
    endDate: null,
    status: "PLANNED" as const,
    projectId: project.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    project,
    ...overrides,
  };
}

let issueLinkCounter = 0;

export function createIssueLink(overrides: Partial<{
  id: string;
  type: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES" | "IS_DUPLICATED_BY";
  fromIssueId: string;
  toIssueId: string;
  createdAt: Date;
  fromIssue?: object;
  toIssue?: object;
}> = {}) {
  issueLinkCounter++;
  return {
    id: `cuid-link-${issueLinkCounter}`,
    type: "RELATES_TO" as const,
    fromIssueId: `cuid-issue-from-${issueLinkCounter}`,
    toIssueId: `cuid-issue-to-${issueLinkCounter}`,
    createdAt: new Date(),
    ...overrides,
  };
}

export function resetSprintCounter() {
  sprintCounter = 0;
  issueLinkCounter = 0;
}
