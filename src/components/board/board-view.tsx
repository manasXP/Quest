"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardColumn } from "@/components/board/board-column";
import { IssueCard } from "@/components/issue/issue-card";
import { IssueDetailPanel } from "@/components/issue/issue-detail-panel";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { IssueFilters } from "@/components/filters/issue-filters";
import { useIssueFilters } from "@/hooks/use-issue-filters";
import { moveIssue } from "@/server/actions/issue";
import type { Issue, Project, User, IssueStatus } from "@prisma/client";

type IssueWithRelations = Issue & {
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  labels: { label: { id: string; name: string; color: string } }[];
  _count: { subtasks: number };
};

interface BoardViewProps {
  project: Project;
  issues: IssueWithRelations[];
  members: Pick<User, "id" | "name" | "email" | "image">[];
  currentUserId: string;
}

const columns: { id: IssueStatus; title: string }[] = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export function BoardView({
  project,
  issues: initialIssues,
  members,
  currentUserId,
}: BoardViewProps) {
  const router = useRouter();
  const [issues, setIssues] = useState(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<IssueWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Sync local state when server data changes (e.g., after router.refresh())
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  const {
    filters,
    filteredIssues,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useIssueFilters({
    issues,
    getIssue: (issue) => issue,
  });

  const getIssuesByStatus = useCallback(
    (status: IssueStatus) => {
      return filteredIssues
        .filter((issue) => issue.status === status)
        .sort((a, b) => a.order - b.order);
    },
    [filteredIssues]
  );

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const destStatus = destination.droppableId as IssueStatus;

    // Get issues in destination column
    const destIssues = getIssuesByStatus(destStatus);

    // Calculate new order
    let newOrder: number;
    if (destIssues.length === 0) {
      newOrder = 0;
    } else if (destination.index === 0) {
      newOrder = destIssues[0].order - 1;
    } else if (destination.index >= destIssues.length) {
      newOrder = destIssues[destIssues.length - 1].order + 1;
    } else {
      const prevOrder = destIssues[destination.index - 1].order;
      const nextOrder = destIssues[destination.index].order;
      newOrder = (prevOrder + nextOrder) / 2;
    }

    // Optimistic update
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === draggableId
          ? { ...issue, status: destStatus, order: newOrder }
          : issue
      )
    );

    // Persist to database
    await moveIssue({
      issueId: draggableId,
      status: destStatus,
      order: newOrder,
    });
  };

  const handleIssueClick = (issue: IssueWithRelations) => {
    setSelectedIssue(issue);
    setDetailOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">Board</p>
        </div>
        <div className="flex items-center gap-3">
          <IssueFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            members={members}
          />
          <CreateIssueDialog
            projectId={project.id}
            members={members}
            onSuccess={handleRefresh}
          >
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Issue
            </Button>
          </CreateIssueDialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                count={getIssuesByStatus(column.id).length}
              >
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 min-h-[200px] p-2 rounded-md transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-slate-100 dark:bg-slate-800"
                          : ""
                      }`}
                    >
                      {getIssuesByStatus(column.id).map((issue, index) => (
                        <Draggable
                          key={issue.id}
                          draggableId={issue.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <IssueCard
                                issue={issue}
                                onClick={() => handleIssueClick(issue)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </BoardColumn>
            ))}
          </div>
        </div>
      </DragDropContext>

      <IssueDetailPanel
        issue={
          selectedIssue
            ? {
                ...selectedIssue,
                reporter: members.find((m) => m.id === selectedIssue.reporterId) || {
                  id: selectedIssue.reporterId,
                  name: "Unknown",
                  email: "",
                  image: null,
                },
              }
            : null
        }
        members={members}
        currentUserId={currentUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleRefresh}
      />
    </div>
  );
}
