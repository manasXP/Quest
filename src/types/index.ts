import type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Issue,
  Label,
  WorkspaceRole,
  IssueType,
  IssueStatus,
  IssuePriority,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Issue,
  Label,
  WorkspaceRole,
  IssueType,
  IssueStatus,
  IssuePriority,
};

// Extended types with relations
export type WorkspaceWithMembers = Workspace & {
  members: (WorkspaceMember & { user: User })[];
  owner: User;
};

export type WorkspaceWithProjects = Workspace & {
  projects: Project[];
};

export type ProjectWithIssues = Project & {
  issues: Issue[];
  lead: User | null;
};

export type IssueWithRelations = Issue & {
  project: Project;
  assignee: User | null;
  reporter: User;
  labels: { label: Label }[];
  subtasks: Issue[];
  parent: Issue | null;
};

// Board view types
export type BoardColumn = {
  id: IssueStatus;
  title: string;
  issues: IssueWithRelations[];
};

// Form types
export type CreateWorkspaceInput = {
  name: string;
  slug?: string;
};

export type CreateProjectInput = {
  name: string;
  key: string;
  description?: string;
  workspaceId: string;
};

export type CreateIssueInput = {
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  projectId: string;
  assigneeId?: string;
  dueDate?: Date;
  parentId?: string;
  labelIds?: string[];
};

export type UpdateIssueInput = Partial<CreateIssueInput> & {
  status?: IssueStatus;
  order?: number;
};

// Session user type
export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};
