# Quest - Data Model

## Entity Relationship

```
User ─┬─< WorkspaceMember >─ Workspace
      │                         │
      │                         └─< Project
      │                               │
      └─────────────────────────────< Issue >─ Comment
                                        │
                                        └─ Label
```

## Prisma Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?

  workspaces    WorkspaceMember[]
  assignedIssues Issue[]  @relation("Assignee")
  reportedIssues Issue[]  @relation("Reporter")
  comments      Comment[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  image       String?

  members     WorkspaceMember[]
  projects    Project[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  role        Role     @default(DEVELOPER)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workspaceId String

  createdAt   DateTime @default(now())

  @@unique([userId, workspaceId])
}

enum Role {
  ADMIN
  DEVELOPER
  TESTER
  GUEST
}

model Project {
  id          String   @id @default(cuid())
  name        String
  key         String   // e.g., "QUEST" for issue IDs like QUEST-123
  description String?
  image       String?

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workspaceId String

  issues      Issue[]
  labels      Label[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([workspaceId, key])
}

model Issue {
  id          String     @id @default(cuid())
  number      Int        // Sequential per project
  title       String
  description String?    @db.Text
  type        IssueType  @default(TASK)
  status      Status     @default(BACKLOG)
  priority    Priority   @default(NONE)

  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String

  assignee    User?      @relation("Assignee", fields: [assigneeId], references: [id])
  assigneeId  String?
  reporter    User?      @relation("Reporter", fields: [reporterId], references: [id])
  reporterId  String?

  parent      Issue?     @relation("Subtasks", fields: [parentId], references: [id])
  parentId    String?
  subtasks    Issue[]    @relation("Subtasks")

  labels      Label[]
  comments    Comment[]

  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@unique([projectId, number])
}

enum IssueType {
  EPIC
  STORY
  TASK
  BUG
}

enum Status {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
  NONE
}

model Label {
  id        String   @id @default(cuid())
  name      String
  color     String   // Hex color

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String

  issues    Issue[]

  @@unique([projectId, name])
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text

  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Notes

- Issue numbers are sequential per project (QUEST-1, QUEST-2, etc.)
- Use `key` field in Project for human-readable issue identifiers
- Subtasks link to parent issue via `parentId`
- Labels are project-scoped for flexibility
