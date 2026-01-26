"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronDown, Star, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getSavedFilters,
  deleteSavedFilter,
  updateSavedFilter,
} from "@/server/actions/filter";
import type { IssueFilters } from "@/lib/validations/search";
import type { SavedFilter } from "@prisma/client";

interface SavedFiltersDropdownProps {
  projectId: string;
  onSelectFilter: (filters: IssueFilters) => void;
  refreshTrigger?: number;
}

export function SavedFiltersDropdown({
  projectId,
  onSelectFilter,
  refreshTrigger,
}: SavedFiltersDropdownProps) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchFilters = async () => {
    const result = await getSavedFilters(projectId);
    setFilters(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchFilters();
  }, [projectId, refreshTrigger]);

  const handleSelect = (filter: SavedFilter) => {
    onSelectFilter(filter.filters as IssueFilters);
  };

  const handleSetDefault = (filterId: string, currentDefault: boolean) => {
    startTransition(async () => {
      await updateSavedFilter(filterId, { isDefault: !currentDefault });
      fetchFilters();
    });
  };

  const handleDelete = (filterId: string) => {
    if (!confirm("Delete this saved filter?")) return;
    startTransition(async () => {
      await deleteSavedFilter(filterId);
      fetchFilters();
    });
  };

  if (loading || filters.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Saved Filters
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Your Saved Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
          >
            <button
              className="flex-1 text-left text-sm truncate"
              onClick={() => handleSelect(filter)}
              disabled={isPending}
            >
              {filter.name}
            </button>
            {filter.isDefault && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  disabled={isPending}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleSetDefault(filter.id, filter.isDefault)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {filter.isDefault ? "Remove as default" : "Set as default"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(filter.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
