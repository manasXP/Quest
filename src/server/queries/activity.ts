import { db } from "@/lib/db";

export async function getActivitiesByIssue(issueId: string) {
  return db.activity.findMany({
    where: { issueId },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
