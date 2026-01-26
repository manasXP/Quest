let filterCounter = 0;

export function createSavedFilter(overrides: Partial<{
  id: string;
  name: string;
  filters: Record<string, unknown>;
  projectId: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    key: string;
    workspace: {
      slug: string;
      ownerId: string;
    };
  };
}> = {}) {
  filterCounter++;
  return {
    id: `cuid-filter-${filterCounter}`,
    name: `Test Filter ${filterCounter}`,
    filters: { status: ["TODO", "IN_PROGRESS"] },
    projectId: `cuid-project-${filterCounter}`,
    userId: `cuid-user-${filterCounter}`,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetFilterCounter() {
  filterCounter = 0;
}
