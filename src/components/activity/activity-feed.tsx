"use client";

import { useEffect, useState, useCallback } from "react";
import { History } from "lucide-react";
import { ActivityItem } from "./activity-item";
import { getActivitiesByIssue } from "@/server/actions/activity";
import type { ActivityWithActor } from "@/types";

interface ActivityFeedProps {
  issueId: string;
}

export function ActivityFeed({ issueId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithActor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await getActivitiesByIssue(issueId);
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No activity recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
