# Quest - Create Issue Feature

## Overview

The Create Issue dialog provides a comprehensive interface for creating new issues with full Jira parity. It supports all issue types, rich text descriptions, file attachments, issue linking, sprint assignment, and more.

## Form Layout

The dialog is a scrollable modal organized into logical field groups:

```
+-----------------------------------------------------+
| Create Issue                              [-] [] [x]|
+-----------------------------------------------------+
| Required fields are marked with an asterisk *       |
|                                                     |
| +- CORE FIELDS ---------------------------------+   |
| | Project*        [Dropdown with project icon]  |   |
| | Type*           [Dropdown: Task/Bug/Story/Epic|   |
| | Status          [Dropdown: initial status]    |   |
| | Summary*        [Text input - required]       |   |
| | Description     [Rich text editor + toolbar]  |   |
| +-----------------------------------------------+   |
|                                                     |
| +- ASSIGNMENT ----------------------------------+   |
| | Assignee        [Dropdown]    [Assign to me]  |   |
| | Reporter*       [Dropdown with avatar]        |   |
| +-----------------------------------------------+   |
|                                                     |
| +- PLANNING ------------------------------------+   |
| | Priority        [Dropdown: Medium default]    |   |
| | Parent          [Dropdown: for subtasks]      |   |
| | Labels          [Multi-select]                |   |
| | Sprint          [Dropdown]                    |   |
| | Story Points    [Number input]                |   |
| +-----------------------------------------------+   |
|                                                     |
| +- DATES ---------------------------------------+   |
| | Start Date      [Date picker]                 |   |
| | Due Date        [Date picker]                 |   |
| +-----------------------------------------------+   |
|                                                     |
| +- ATTACHMENTS ---------------------------------+   |
| | [Drop files to attach or] [Browse]            |   |
| | [File list with remove buttons]               |   |
| +-----------------------------------------------+   |
|                                                     |
| +- RELATIONSHIPS -------------------------------+   |
| | Linked Issues   [Type: blocks v]              |   |
| |                 [Search issues or paste URL]  |   |
| +-----------------------------------------------+   |
|                                                     |
| +- FLAGS ---------------------------------------+   |
| | [ ] Flagged (Impediment)                      |   |
| +-----------------------------------------------+   |
|                                                     |
+-----------------------------------------------------+
| [ ] Create another          [Cancel]  [Create]      |
+-----------------------------------------------------+
```

---

## Field Specifications

### Required Fields

| Field | Type | Validation | Default |
|-------|------|------------|---------|
| Project | Select | Required, valid project | Current project context |
| Type | Select | Required, valid type | TASK |
| Summary | Text | 1-200 characters, required | Empty |
| Reporter | Select | Required, valid workspace member | Current user (auto-filled) |

### Optional Fields

| Field | Type | Validation | Default |
|-------|------|------------|---------|
| Status | Select | Valid status for project | TODO |
| Description | Rich Text | Max 50,000 characters | Empty |
| Assignee | Select | Valid workspace member or null | Unassigned |
| Priority | Select | Valid priority enum | MEDIUM |
| Parent | Select | Valid issue in same project | None |
| Labels | Multi-select | Valid project labels | Empty |
| Sprint | Select | Valid project sprint | None |
| Story Points | Number | Integer 0-100 | None |
| Start Date | Date | Valid date | None |
| Due Date | Date | >= Start Date if both set | None |
| Attachments | Files | 10MB each, allowed MIME types | Empty |
| Linked Issues | Multi-select | Valid issues | Empty |
| Flagged | Boolean | - | false |

---

## Field Details

### Project Selector
- Displays project icon/avatar and name
- Defaults to current project context if opened from project view
- Required field - cannot submit without selection

### Issue Type
- Options: Epic, Story, Task, Bug
- Each type has a distinct icon
- Affects available fields (e.g., Epics cannot have parent issues)

### Summary
- Single-line text input
- Character limit: 200 characters
- Real-time character count display
- Validates on blur and submit

### Description (Rich Text Editor)

Uses Tiptap editor with the following capabilities:

**Toolbar Features:**
- Text formatting: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Strikethrough
- Headings: H1, H2, H3
- Lists: Bullet list, Numbered list
- Code: Inline code, Code block with syntax highlighting
- Links: Insert/edit hyperlinks
- @mentions: Mention team members (autocomplete)
- Undo/Redo

**Keyboard Shortcuts:**
| Action | Shortcut |
|--------|----------|
| Bold | `Ctrl/Cmd + B` |
| Italic | `Ctrl/Cmd + I` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Link | `Ctrl/Cmd + K` |
| Code | `Ctrl/Cmd + E` |

### Assignee
- Searchable dropdown of workspace members
- Displays avatar and name
- "Assign to me" quick action button
- Can be left unassigned

### Reporter
- Auto-filled with current user
- Can be changed by users with appropriate permissions
- Required field

### Priority
- Options: Urgent, High, Medium (default), Low, None
- Each priority has distinct color coding

### Parent Issue (Subtasks)
- Only shown when creating subtasks
- Searchable dropdown of issues in same project
- Excludes the issue being edited (if editing)
- Epics cannot be subtasks

### Labels
- Multi-select with project-scoped labels
- Displays label color chips
- Type to search/filter

### Sprint
- Dropdown of project sprints
- Shows sprint name and status (Planned/Active/Completed)
- Only Active and Planned sprints shown by default

### Story Points
- Number input field
- Accepts integers 0-100
- Used for sprint planning and velocity tracking

### Dates
- Start Date: Calendar date picker
- Due Date: Calendar date picker
- Validation: Due Date must be >= Start Date if both are set

### Attachments

See [[03-Attachments]] for full attachment documentation.

- Drag-and-drop zone
- Browse button for file selection
- File list with:
  - Filename
  - File size
  - Remove button (X)
- Validation:
  - Max 10MB per file
  - Allowed MIME types (images, documents, archives)

### Linked Issues
- Link type selector: Blocks, Is blocked by, Relates to, Duplicates, Is duplicated by
- Issue search with autocomplete
- Displays linked issues as chips with remove button
- Can paste issue URL to quick-link

### Flagged
- Checkbox for marking issue as impediment
- Flagged issues display visual indicator on board

---

## User Flows

### Basic Issue Creation

1. User clicks "Create Issue" button (in header or board)
2. Modal opens with Project and Type pre-selected
3. User enters Summary (required)
4. User optionally fills other fields
5. User clicks "Create"
6. Issue is created, modal closes
7. Toast notification confirms creation
8. Issue appears in appropriate view (board/backlog)

### Creating a Subtask

1. User opens parent issue detail view
2. User clicks "Create subtask" or uses keyboard shortcut
3. Modal opens with:
   - Project: inherited from parent
   - Parent: pre-filled with parent issue
   - Type: defaults to Task
4. User fills required fields
5. User clicks "Create"
6. Subtask appears nested under parent

### Adding Attachments During Creation

1. User opens Create Issue dialog
2. User drags files onto drop zone OR clicks "Browse"
3. Files appear in attachment list with upload progress
4. User can remove files before submit
5. On submit, files are uploaded to Vercel Blob
6. Attachment records created and linked to issue

### Linking Issues

1. In Create Issue dialog, user expands Relationships section
2. User selects link type (e.g., "Blocks")
3. User searches for target issue by key or title
4. User selects issue from autocomplete
5. Link appears as chip
6. On submit, IssueLink record is created

### "Create Another" Workflow

1. User checks "Create another" checkbox at bottom of dialog
2. User fills fields and clicks "Create"
3. Issue is created
4. Toast confirms creation
5. Dialog remains open with:
   - Project, Type, Sprint retained
   - Summary, Description, Attachments cleared
   - Assignee, Priority retained (configurable)
6. User can immediately create next issue

---

## Validation Rules

### Client-Side Validation
- Summary: Required, 1-200 characters
- Story Points: Integer, 0-100 range
- Due Date >= Start Date when both present
- File size <= 10MB per attachment
- File type in allowed MIME types

### Server-Side Validation
- All client validations re-checked
- Project membership verified
- Assignee is workspace member
- Reporter is workspace member
- Sprint belongs to same project
- Parent issue belongs to same project
- Linked issues exist and user has access

### Error Display
- Field-level errors appear below input
- Toast notifications for server errors
- Form-level errors at top of dialog

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move to next field |
| `Shift+Tab` | Move to previous field |
| `Enter` | Submit form (when not in textarea) |
| `Escape` | Close dialog |
| `Ctrl+Enter` | Submit from any field |

---

## Accessibility

- All form fields have associated labels
- Error messages linked to fields via aria-describedby
- Focus management: focus moves to first field on open
- Focus trap within modal
- Escape key closes modal
- Submit button disabled while loading
- Screen reader announcements for errors and success

---

## Related Documentation

- [[02-Data-Model]] - Issue, Sprint, and IssueLink schema
- [[03-Attachments]] - File upload details
- [[01-Features]] - Feature overview
