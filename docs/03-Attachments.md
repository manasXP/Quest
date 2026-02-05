# Quest - File Attachments

## Overview

The attachments feature allows users to upload, view, and delete files on any issue they have access to. Files are stored using Vercel Blob and metadata is stored in the database.

## Features

- Upload files up to 10MB
- Support for images, documents, spreadsheets, and archives
- Image thumbnails for visual files
- File type icons for non-image files
- Download files directly
- Delete attachments (with permission checks)
- Cascade delete when parent issue is deleted

## Supported File Types

| Category | MIME Types | Extensions |
|----------|-----------|------------|
| Images | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` | .jpg, .jpeg, .png, .gif, .webp, .svg |
| Documents | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .pdf, .doc, .docx |
| Spreadsheets | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xls, .xlsx |
| Presentations | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .ppt, .pptx |
| Text | `text/plain`, `text/csv`, `text/markdown` | .txt, .csv, .md |
| Archives | `application/zip`, `application/x-rar-compressed`, `application/gzip` | .zip, .rar, .gz |

## Data Model

```prisma
model Attachment {
  id         String   @id @default(cuid())
  filename   String   // Original filename
  url        String   // Vercel Blob URL
  size       Int      // File size in bytes
  mimeType   String   // MIME type
  issueId    String   // Parent issue
  uploaderId String   // User who uploaded
  createdAt  DateTime @default(now())

  issue    Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  uploader User  @relation("AttachmentUploader", fields: [uploaderId], references: [id])

  @@index([issueId])
  @@map("attachments")
}
```

## Permissions

| Action | Allowed By |
|--------|-----------|
| Upload | Any workspace member |
| View/Download | Any workspace member |
| Delete | Uploader, workspace owner, or admin |

## API

### Upload Attachment

**Endpoint:** `POST /api/attachments/upload`

**Request:** `multipart/form-data`
- `file` - The file to upload
- `issueId` - The issue ID to attach to

**Response:**
```json
{
  "data": {
    "id": "cuid",
    "filename": "document.pdf",
    "url": "https://blob.vercel-storage.com/...",
    "size": 1024000,
    "mimeType": "application/pdf",
    "issueId": "cuid",
    "uploaderId": "cuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "uploader": {
      "id": "cuid",
      "name": "User Name",
      "email": "user@example.com",
      "image": null
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized (not logged in)
- `400` - No file provided, missing issueId, file too large, or unsupported file type
- `403` - No access to the issue
- `404` - Issue not found
- `500` - Upload failed

### Server Actions

#### `getAttachmentsByIssue(issueId: string)`
Returns all attachments for an issue, ordered by `createdAt` descending.

#### `deleteAttachment(attachmentId: string)`
Deletes an attachment from Vercel Blob and the database. Returns `{ success: true }` or `{ error: string }`.

## UI Components

### AttachmentList
Container component that fetches and displays attachments for an issue.

```tsx
<AttachmentList issueId={issue.id} currentUserId={userId} />
```

### AttachmentUpload
Upload button with hidden file input. Handles client-side validation before upload.

```tsx
<AttachmentUpload issueId={issue.id} onSuccess={() => refresh()} />
```

### AttachmentItem
Single attachment display with thumbnail/icon, file info, download and delete buttons.

```tsx
<AttachmentItem
  attachment={attachment}
  currentUserId={userId}
  onDelete={() => refresh()}
/>
```

## Configuration

### Environment Variables

Add to `.env.local`:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Get this token from Vercel Dashboard > Storage > Blob > Settings.

### Upload Limits

Configured in `src/lib/upload.ts`:
- `MAX_FILE_SIZE` - 10MB (10 * 1024 * 1024 bytes)
- `ALLOWED_FILE_TYPES` - Map of MIME types to extensions

## File Structure

```
src/
├── app/api/attachments/
│   └── upload/
│       └── route.ts          # Upload API route
├── components/attachment/
│   ├── index.ts              # Barrel exports
│   ├── attachment-list.tsx   # List container
│   ├── attachment-upload.tsx # Upload button
│   └── attachment-item.tsx   # Single attachment
├── lib/
│   ├── upload.ts             # Upload config & helpers
│   └── validations/
│       └── attachment.ts     # Zod schemas
├── server/actions/
│   └── attachment.ts         # Server actions
├── test/factories/
│   └── attachment.ts         # Test factory
└── types/
    └── index.ts              # AttachmentWithUploader type
```

## Testing

Tests cover:
- Upload validation schemas
- File size formatting
- MIME type checking
- Server action authentication
- Permission-based deletion
- Error handling

Run tests:
```bash
npm test
```

## Security Considerations

1. **File Type Validation** - Both client and server validate MIME types
2. **File Size Limit** - 10MB max enforced on both client and server
3. **Access Control** - Only workspace members can upload/view
4. **Delete Permissions** - Only uploader, owner, or admin can delete
5. **Cascade Delete** - Attachments auto-delete when issue is deleted
6. **Filename Sanitization** - Special characters replaced with underscores
