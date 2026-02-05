let attachmentCounter = 0;

export function createAttachment(overrides: Partial<{
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  issueId: string;
  uploaderId: string;
  createdAt: Date;
  uploader?: { id: string; name: string; email: string; image: string | null };
  issue?: {
    id: string;
    project: {
      key: string;
      workspace: {
        slug: string;
        ownerId: string;
        members: { userId: string; role: string }[];
      };
    };
  };
}> = {}) {
  attachmentCounter++;
  return {
    id: `cuid-attachment-${attachmentCounter}`,
    filename: `test-file-${attachmentCounter}.pdf`,
    url: `https://blob.vercel-storage.com/attachments/test-${attachmentCounter}.pdf`,
    size: 1024 * attachmentCounter,
    mimeType: "application/pdf",
    issueId: `cuid-issue-${attachmentCounter}`,
    uploaderId: `cuid-user-${attachmentCounter}`,
    createdAt: new Date(),
    uploader: {
      id: `cuid-user-${attachmentCounter}`,
      name: `User ${attachmentCounter}`,
      email: `user${attachmentCounter}@test.com`,
      image: null,
    },
    ...overrides,
  };
}

export function resetAttachmentCounter() {
  attachmentCounter = 0;
}
