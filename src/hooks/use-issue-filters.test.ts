import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIssueFilters } from "./use-issue-filters";

interface TestIssue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  assigneeId: string | null;
  labels: { label: { id: string } }[];
}

const createTestIssue = (overrides: Partial<TestIssue> = {}): TestIssue => ({
  id: `issue-${Math.random()}`,
  title: "Test Issue",
  description: null,
  status: "BACKLOG",
  priority: "MEDIUM",
  type: "TASK",
  assigneeId: null,
  labels: [],
  ...overrides,
});

const getIssue = (item: TestIssue) => item;

describe("useIssueFilters", () => {
  describe("initial state", () => {
    it("should return all issues when no filters", () => {
      const issues = [
        createTestIssue({ id: "1" }),
        createTestIssue({ id: "2" }),
        createTestIssue({ id: "3" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      expect(result.current.filteredIssues).toHaveLength(3);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("should have empty filters initially", () => {
      const { result } = renderHook(() => useIssueFilters({ issues: [], getIssue }));

      expect(result.current.filters).toEqual({});
    });
  });

  describe("search filter", () => {
    it("should filter by title (case-insensitive)", () => {
      const issues = [
        createTestIssue({ title: "Login Bug" }),
        createTestIssue({ title: "Signup Form" }),
        createTestIssue({ title: "User Profile" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "login");
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].title).toBe("Login Bug");
    });

    it("should filter by description (case-insensitive)", () => {
      const issues = [
        createTestIssue({ title: "Issue 1", description: "Fix the authentication flow" }),
        createTestIssue({ title: "Issue 2", description: "Update user interface" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "AUTHENTICATION");
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].title).toBe("Issue 1");
    });

    it("should match either title OR description", () => {
      const issues = [
        createTestIssue({ title: "Payment Bug", description: "Fix credit card" }),
        createTestIssue({ title: "Other Issue", description: "Payment processing" }),
        createTestIssue({ title: "Unrelated", description: "Something else" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "payment");
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });

    it("should handle null description", () => {
      const issues = [
        createTestIssue({ title: "Test", description: null }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "something");
      });

      expect(result.current.filteredIssues).toHaveLength(0);
    });
  });

  describe("status filter", () => {
    it("should filter by single status", () => {
      const issues = [
        createTestIssue({ status: "BACKLOG" }),
        createTestIssue({ status: "IN_PROGRESS" }),
        createTestIssue({ status: "DONE" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("status", ["IN_PROGRESS"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].status).toBe("IN_PROGRESS");
    });

    it("should filter by multiple statuses (OR logic)", () => {
      const issues = [
        createTestIssue({ status: "BACKLOG" }),
        createTestIssue({ status: "TODO" }),
        createTestIssue({ status: "IN_PROGRESS" }),
        createTestIssue({ status: "DONE" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("status", ["BACKLOG", "TODO"]);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });

    it("should return all issues when status array is empty", () => {
      const issues = [
        createTestIssue({ status: "BACKLOG" }),
        createTestIssue({ status: "DONE" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("status", []);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });
  });

  describe("priority filter", () => {
    it("should filter by single priority", () => {
      const issues = [
        createTestIssue({ priority: "HIGH" }),
        createTestIssue({ priority: "MEDIUM" }),
        createTestIssue({ priority: "LOW" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("priority", ["HIGH"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].priority).toBe("HIGH");
    });

    it("should filter by multiple priorities", () => {
      const issues = [
        createTestIssue({ priority: "URGENT" }),
        createTestIssue({ priority: "HIGH" }),
        createTestIssue({ priority: "MEDIUM" }),
        createTestIssue({ priority: "LOW" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("priority", ["URGENT", "HIGH"]);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });
  });

  describe("type filter", () => {
    it("should filter by single type", () => {
      const issues = [
        createTestIssue({ type: "BUG" }),
        createTestIssue({ type: "TASK" }),
        createTestIssue({ type: "STORY" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("type", ["BUG"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].type).toBe("BUG");
    });

    it("should filter by multiple types", () => {
      const issues = [
        createTestIssue({ type: "BUG" }),
        createTestIssue({ type: "TASK" }),
        createTestIssue({ type: "STORY" }),
        createTestIssue({ type: "EPIC" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("type", ["BUG", "TASK"]);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });
  });

  describe("assignee filter", () => {
    it("should filter by single assignee", () => {
      const issues = [
        createTestIssue({ assigneeId: "user-1" }),
        createTestIssue({ assigneeId: "user-2" }),
        createTestIssue({ assigneeId: null }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("assigneeId", ["user-1"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].assigneeId).toBe("user-1");
    });

    it("should filter by multiple assignees", () => {
      const issues = [
        createTestIssue({ assigneeId: "user-1" }),
        createTestIssue({ assigneeId: "user-2" }),
        createTestIssue({ assigneeId: "user-3" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("assigneeId", ["user-1", "user-2"]);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });

    it("should exclude unassigned issues when filtering by assignee", () => {
      const issues = [
        createTestIssue({ assigneeId: "user-1" }),
        createTestIssue({ assigneeId: null }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("assigneeId", ["user-1"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].assigneeId).toBe("user-1");
    });
  });

  describe("label filter", () => {
    it("should filter by single label", () => {
      const issues = [
        createTestIssue({ labels: [{ label: { id: "label-1" } }] }),
        createTestIssue({ labels: [{ label: { id: "label-2" } }] }),
        createTestIssue({ labels: [] }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("labelIds", ["label-1"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
    });

    it("should use OR logic for labels (any match passes)", () => {
      const issues = [
        createTestIssue({ labels: [{ label: { id: "label-1" } }] }),
        createTestIssue({ labels: [{ label: { id: "label-2" } }] }),
        createTestIssue({ labels: [{ label: { id: "label-3" } }] }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("labelIds", ["label-1", "label-2"]);
      });

      expect(result.current.filteredIssues).toHaveLength(2);
    });

    it("should match issue with multiple labels", () => {
      const issues = [
        createTestIssue({
          labels: [{ label: { id: "label-1" } }, { label: { id: "label-2" } }],
        }),
        createTestIssue({ labels: [{ label: { id: "label-3" } }] }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("labelIds", ["label-1"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
    });
  });

  describe("combined filters (AND logic between filter types)", () => {
    it("should apply AND logic between different filter types", () => {
      const issues = [
        createTestIssue({ status: "IN_PROGRESS", priority: "HIGH", type: "BUG" }),
        createTestIssue({ status: "IN_PROGRESS", priority: "LOW", type: "BUG" }),
        createTestIssue({ status: "DONE", priority: "HIGH", type: "BUG" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("status", ["IN_PROGRESS"]);
        result.current.updateFilter("priority", ["HIGH"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].status).toBe("IN_PROGRESS");
      expect(result.current.filteredIssues[0].priority).toBe("HIGH");
    });

    it("should combine search with other filters", () => {
      const issues = [
        createTestIssue({ title: "Login Bug", status: "BACKLOG" }),
        createTestIssue({ title: "Login Feature", status: "IN_PROGRESS" }),
        createTestIssue({ title: "Signup Bug", status: "BACKLOG" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "login");
        result.current.updateFilter("status", ["BACKLOG"]);
      });

      expect(result.current.filteredIssues).toHaveLength(1);
      expect(result.current.filteredIssues[0].title).toBe("Login Bug");
    });
  });

  describe("clearFilters", () => {
    it("should reset all filters", () => {
      const issues = [
        createTestIssue({ status: "BACKLOG" }),
        createTestIssue({ status: "IN_PROGRESS" }),
      ];

      const { result } = renderHook(() => useIssueFilters({ issues, getIssue }));

      act(() => {
        result.current.updateFilter("search", "test");
        result.current.updateFilter("status", ["BACKLOG"]);
        result.current.updateFilter("priority", ["HIGH"]);
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.filteredIssues).toHaveLength(2);
    });
  });

  describe("hasActiveFilters", () => {
    it("should be false with no filters", () => {
      const { result } = renderHook(() => useIssueFilters({ issues: [], getIssue }));

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("should be true with search filter", () => {
      const { result } = renderHook(() => useIssueFilters({ issues: [], getIssue }));

      act(() => {
        result.current.updateFilter("search", "test");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("should be true with status filter", () => {
      const { result } = renderHook(() => useIssueFilters({ issues: [], getIssue }));

      act(() => {
        result.current.updateFilter("status", ["BACKLOG"]);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("should be false with empty arrays", () => {
      const { result } = renderHook(() => useIssueFilters({ issues: [], getIssue }));

      act(() => {
        result.current.updateFilter("status", []);
        result.current.updateFilter("priority", []);
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });
  });
});
