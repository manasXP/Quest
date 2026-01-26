import { createWorkspace } from "./workspace";

let issueCounter = 0;

export function createIssue(overrides: Partial<{
  id: string;
  key: string;
  title: string;
  description: string | null;
  type: "EPIC" | "STORY" | "TASK" | "BUG";
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  order: number;
  projectId: string;
  reporterId: string;
  assigneeId: string | null;
  parentId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: ReturnType<typeof createProject>;
  assignee?: { id: string; name: string; email: string; image: string | null } | null;
  labels?: { label: { id: string; name: string; color: string } }[];
}> = {}) {
  issueCounter++;
  return {
    id: `cuid-issue-${issueCounter}`,
    key: `PROJ-${issueCounter}`,
    title: `Test Issue ${issueCounter}`,
    description: `Description for issue ${issueCounter}`,
    type: "TASK" as const,
    status: "BACKLOG" as const,
    priority: "MEDIUM" as const,
    order: issueCounter,
    projectId: `cuid-project-${issueCounter}`,
    reporterId: `cuid-user-${issueCounter}`,
    assigneeId: null,
    parentId: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    labels: [],
    ...overrides,
  };
}

let projectCounter = 0;

export function createProject(overrides: Partial<{
  id: string;
  name: string;
  key: string;
  description: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  workspace?: ReturnType<typeof createWorkspace>;
}> = {}) {
  projectCounter++;
  const workspace = overrides.workspace ?? createWorkspace();
  return {
    id: `cuid-project-${projectCounter}`,
    name: `Test Project ${projectCounter}`,
    key: `PROJ${projectCounter}`,
    description: null,
    workspaceId: workspace.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace,
    ...overrides,
  };
}

export function resetIssueCounter() {
  issueCounter = 0;
  projectCounter = 0;
}
