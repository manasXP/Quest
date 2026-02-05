import { vi } from "vitest";
import { auth } from "@/lib/auth";

type Session = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
} | null;

export function mockAuthenticatedUser(user: {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}) {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: user.id,
      email: user.email ?? `${user.id}@test.com`,
      name: user.name ?? "Test User",
      image: user.image ?? null,
    },
  } as unknown as Awaited<ReturnType<typeof auth>>);
}

export function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
}
