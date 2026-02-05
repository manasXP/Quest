# Quest - Feature Requirements

## Core Features

### Workspaces
- Create/edit/delete workspaces
- Invite members to workspace
- Member roles: Admin, Developer, Tester, Guest

### Projects
- Create projects within a workspace
- Project settings and visibility
- Archive/restore projects

### Issues
- Create, edit, delete issues
- Issue types: Task, Bug, Story, Epic
- Priority levels: Urgent, High, Medium, Low, None
- Status workflow: Backlog → Todo → In Progress → In Review → Done
- Assignee and reporter
- Due dates and start dates
- Labels/tags
- Comments and activity feed
- File attachments
- Story points for estimation
- Flagged/impediment indicator

#### Create Issue Dialog
Full-featured issue creation with:
- Project and type selection
- Rich text description (Tiptap editor with formatting, @mentions)
- Assignment (Assignee, Reporter)
- Planning fields (Priority, Sprint, Story Points, Labels)
- Date fields (Start Date, Due Date)
- File attachments (drag-and-drop)
- Issue linking (blocks, duplicates, relates to)
- Flagged checkbox for impediments
- "Create another" workflow for batch creation

### Sprints
- Create, edit, delete sprints within a project
- Sprint properties: name, goal, start date, end date
- Sprint status: Planned, Active, Completed
- Assign issues to sprints
- Only one active sprint per project at a time
- Sprint backlog view for planning

### Issue Linking
- Link related issues with relationship types:
  - **Blocks / Is blocked by**: Dependency relationships
  - **Relates to**: General relationships
  - **Duplicates / Is duplicated by**: Duplicate tracking
- View linked issues on issue detail page
- Navigate between linked issues

### Boards
- Kanban board view
- Drag-and-drop between columns
- Swimlanes by assignee/priority
- Filter and search

### Backlog
- List view of all issues
- Bulk actions
- Sprint planning
- Drag issues between sprints

## Secondary Features

### Search
- Global search across projects
- Filter by status, assignee, labels, dates

### Notifications
- In-app notifications
- Email notifications (optional)

### Activity
- Activity feed per issue
- Project activity timeline

## Future Enhancements

- Velocity tracking and burndown charts
- Time tracking
- Custom fields
- Automations/workflows
- Integrations (GitHub, Slack)
- Reports and dashboards
