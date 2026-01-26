"use client";

import { useState, useMemo, useCallback } from "react";
import type { IssueFilters } from "@/lib/validations/search";

interface UseIssueFiltersOptions<T> {
  issues: T[];
  getIssue: (item: T) => {
    title: string;
    description: string | null;
    status: string;
    priority: string;
    type: string;
    assigneeId: string | null;
    labels: { label: { id: string } }[];
  };
}

export function useIssueFilters<T>({ issues, getIssue }: UseIssueFiltersOptions<T>) {
  const [filters, setFilters] = useState<IssueFilters>({});

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      const issue = getIssue(item);

      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(searchLower);
        const matchesDescription = issue.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(issue.status as typeof filters.status[number])) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(issue.priority as typeof filters.priority[number])) {
          return false;
        }
      }

      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(issue.type as typeof filters.type[number])) {
          return false;
        }
      }

      // Assignee filter
      if (filters.assigneeId && filters.assigneeId.length > 0) {
        if (!issue.assigneeId || !filters.assigneeId.includes(issue.assigneeId)) {
          return false;
        }
      }

      // Label filter
      if (filters.labelIds && filters.labelIds.length > 0) {
        const issueLabels = issue.labels.map((l) => l.label.id);
        const hasMatchingLabel = filters.labelIds.some((id) =>
          issueLabels.includes(id)
        );
        if (!hasMatchingLabel) {
          return false;
        }
      }

      return true;
    });
  }, [issues, filters, getIssue]);

  const updateFilter = useCallback(
    <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo((): boolean => {
    return Boolean(
      filters.search ||
      (filters.status && filters.status.length > 0) ||
      (filters.priority && filters.priority.length > 0) ||
      (filters.type && filters.type.length > 0) ||
      (filters.assigneeId && filters.assigneeId.length > 0) ||
      (filters.labelIds && filters.labelIds.length > 0)
    );
  }, [filters]);

  return {
    filters,
    filteredIssues,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
