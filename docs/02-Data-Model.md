# Quest - Data Model

## Entity Relationship

```
User ─┬─< WorkspaceMember >─ Workspace
      │                         │
      │                         └─< Project ─< Sprint
      │                               │
      └─────────────────────────────< Issue >─┬─ Comment
                                              ├─ Label
                                              ├─ Attachment
                                              └─< IssueLink
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
  sprints     Sprint[]

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

  // Planning fields
  startDate   DateTime?           // Start date for planning
  dueDate     DateTime?
  storyPoints Int?                // Story point estimate (0-100)
  flagged     Boolean   @default(false)  // Impediment flag

  // Sprint relation
  sprintId    String?
  sprint      Sprint?   @relation(fields: [sprintId], references: [id])

  // Issue linking
  linkedFrom  IssueLink[] @relation("LinkedFrom")
  linkedTo    IssueLink[] @relation("LinkedTo")

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

// ============================================
// Sprint Model
// ============================================

model Sprint {
  id          String       @id @default(cuid())
  name        String
  goal        String?
  startDate   DateTime?
  endDate     DateTime?
  status      SprintStatus @default(PLANNED)

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String

  issues      Issue[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([projectId, name])
}

enum SprintStatus {
  PLANNED
  ACTIVE
  COMPLETED
}

// ============================================
// Issue Link Model
// ============================================

model IssueLink {
  id          String    @id @default(cuid())
  type        LinkType  @default(BLOCKS)

  fromIssue   Issue     @relation("LinkedFrom", fields: [fromIssueId], references: [id], onDelete: Cascade)
  fromIssueId String
  toIssue     Issue     @relation("LinkedTo", fields: [toIssueId], references: [id], onDelete: Cascade)
  toIssueId   String

  createdAt   DateTime  @default(now())

  @@unique([fromIssueId, toIssueId, type])
}

enum LinkType {
  BLOCKS
  IS_BLOCKED_BY
  RELATES_TO
  DUPLICATES
  IS_DUPLICATED_BY
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

model Attachment {
  id         String   @id @default(cuid())
  filename   String
  url        String   // Vercel Blob storage URL
  size       Int      // File size in bytes
  mimeType   String

  issue      Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId    String
  uploader   User     @relation("AttachmentUploader", fields: [uploaderId], references: [id])
  uploaderId String

  createdAt  DateTime @default(now())

  @@index([issueId])
}
```

## Notes

- Issue numbers are sequential per project (QUEST-1, QUEST-2, etc.)
- Use `key` field in Project for human-readable issue identifiers
- Subtasks link to parent issue via `parentId`
- Labels are project-scoped for flexibility
- Attachments are stored in Vercel Blob with metadata in the database
- Attachments cascade delete when their parent issue is deleted
- Sprints are project-scoped and can contain multiple issues
- Issue links are directional (from → to) with a type describing the relationship
- Story points are optional and used for sprint velocity tracking
- Flagged issues indicate impediments requiring attention
