let userCounter = 0;

export function createUser(overrides: Partial<{
  id: string;
  name: string;
  email: string;
  image: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  userCounter++;
  return {
    id: `cuid-user-${userCounter}`,
    name: `Test User ${userCounter}`,
    email: `user${userCounter}@test.com`,
    image: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetUserCounter() {
  userCounter = 0;
}
