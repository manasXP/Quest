import type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Issue,
  Label,
  Comment,
  Activity,
  Invitation,
  Attachment,
  WorkspaceRole,
  IssueType,
  IssueStatus,
  IssuePriority,
  InvitationStatus,
  ActivityAction,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Workspace,
  WorkspaceMember,
  Project,
  Issue,
  Label,
  Comment,
  Activity,
  Invitation,
  Attachment,
  WorkspaceRole,
  IssueType,
  IssueStatus,
  IssuePriority,
  InvitationStatus,
  ActivityAction,
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

// Comment types
export type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "name" | "email" | "image">;
};

// Activity types
export type ActivityWithActor = Activity & {
  actor: Pick<User, "id" | "name" | "email" | "image">;
};

// Invitation types
export type InvitationWithDetails = Invitation & {
  workspace: Pick<Workspace, "id" | "name" | "slug">;
  invitedBy: Pick<User, "id" | "name" | "email" | "image">;
};

// Attachment types
export type AttachmentWithUploader = Attachment & {
  uploader: Pick<User, "id" | "name" | "email" | "image">;
};
