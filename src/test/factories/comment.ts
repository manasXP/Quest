let commentCounter = 0;

export function createComment(overrides: Partial<{
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: { id: string; name: string; email: string; image: string | null };
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
  commentCounter++;
  return {
    id: `cuid-comment-${commentCounter}`,
    content: `Test comment ${commentCounter}`,
    issueId: `cuid-issue-${commentCounter}`,
    authorId: `cuid-user-${commentCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: `cuid-user-${commentCounter}`,
      name: `User ${commentCounter}`,
      email: `user${commentCounter}@test.com`,
      image: null,
    },
    ...overrides,
  };
}

export function resetCommentCounter() {
  commentCounter = 0;
}
