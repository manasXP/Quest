"use client";

import { useState } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "./search-input";
import { SaveFilterDialog } from "./save-filter-dialog";
import { SavedFiltersDropdown } from "./saved-filters-dropdown";
import type { IssueFilters } from "@/lib/validations/search";
import type { User } from "@prisma/client";

interface IssueFiltersProps {
  filters: IssueFilters;
  onFilterChange: <K extends keyof IssueFilters>(
    key: K,
    value: IssueFilters[K]
  ) => void;
  onClearFilters: () => void;
  onLoadFilters?: (filters: IssueFilters) => void;
  hasActiveFilters: boolean;
  members: Pick<User, "id" | "name" | "email" | "image">[];
  projectId?: string;
}

const statusOptions = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const priorityOptions = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
] as const;

const typeOptions = [
  { value: "EPIC", label: "Epic" },
  { value: "STORY", label: "Story" },
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
] as const;

export function IssueFilters({
  filters,
  onFilterChange,
  onClearFilters,
  onLoadFilters,
  hasActiveFilters,
  members,
  projectId,
}: IssueFiltersProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFilterSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectFilter = (savedFilters: IssueFilters) => {
    if (onLoadFilters) {
      onLoadFilters(savedFilters);
    }
  };

  const toggleArrayFilter = <K extends keyof IssueFilters>(
    key: K,
    value: string
  ) => {
    const current = (filters[key] as string[] | undefined) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(key, updated.length > 0 ? (updated as IssueFilters[K]) : undefined);
  };

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.type?.length || 0) +
    (filters.assigneeId?.length || 0);

  return (
    <div className="flex items-center gap-2">
      <SearchInput
        value={filters.search || ""}
        onChange={(value) => onFilterChange("search", value || undefined)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4" align="start">
          <div className="space-y-4">
            <FilterSection
              title="Status"
              options={statusOptions}
              selected={filters.status || []}
              onToggle={(value) => toggleArrayFilter("status", value)}
            />
            <Separator />
            <FilterSection
              title="Priority"
              options={priorityOptions}
              selected={filters.priority || []}
              onToggle={(value) => toggleArrayFilter("priority", value)}
            />
            <Separator />
            <FilterSection
              title="Type"
              options={typeOptions}
              selected={filters.type || []}
              onToggle={(value) => toggleArrayFilter("type", value)}
            />
            <Separator />
            <FilterSection
              title="Assignee"
              options={members.map((m) => ({
                value: m.id,
                label: m.name || m.email,
              }))}
              selected={filters.assigneeId || []}
              onToggle={(value) => toggleArrayFilter("assigneeId", value)}
            />
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 px-2 text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}

      {projectId && (
        <>
          <SavedFiltersDropdown
            projectId={projectId}
            onSelectFilter={handleSelectFilter}
            refreshTrigger={refreshTrigger}
          />
          <SaveFilterDialog
            projectId={projectId}
            filters={filters}
            onSuccess={handleFilterSaved}
            disabled={!hasActiveFilters}
          />
        </>
      )}
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onToggle(option.value)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
