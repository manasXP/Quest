"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssueType } from "@prisma/client";

interface Issue {
  id: string;
  key: string;
  title: string;
  type: IssueType;
}

interface ParentIssueSelectorProps {
  issues: Issue[];
  value?: string | null;
  onChange: (issueId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeId?: string;
}

const typeColors: Record<IssueType, string> = {
  EPIC: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  STORY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TASK: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  BUG: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ParentIssueSelector({
  issues,
  value,
  onChange,
  disabled,
  placeholder = "Select parent issue...",
  excludeId,
}: ParentIssueSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter to only show EPIC and STORY issues as potential parents
  const availableIssues = issues.filter(
    (issue) =>
      (issue.type === "EPIC" || issue.type === "STORY") &&
      issue.id !== excludeId
  );

  const selectedIssue = issues.find((issue) => issue.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-auto min-h-9",
            !selectedIssue && "text-muted-foreground"
          )}
        >
          {selectedIssue ? (
            <div className="flex items-center gap-2 truncate">
              <Badge
                variant="secondary"
                className={cn("text-xs shrink-0", typeColors[selectedIssue.type])}
              >
                {selectedIssue.type}
              </Badge>
              <span className="font-medium shrink-0">{selectedIssue.key}</span>
              <span className="truncate text-muted-foreground">
                {selectedIssue.title}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <div className="flex items-center gap-1 shrink-0">
            {selectedIssue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="hover:bg-muted rounded p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search issues..." />
          <CommandList>
            <CommandEmpty>No issues found</CommandEmpty>
            <CommandGroup>
              {availableIssues.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={`${issue.key} ${issue.title}`}
                  onSelect={() => {
                    onChange(issue.id === value ? null : issue.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === issue.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Badge
                    variant="secondary"
                    className={cn("mr-2 text-xs shrink-0", typeColors[issue.type])}
                  >
                    {issue.type}
                  </Badge>
                  <span className="font-medium shrink-0">{issue.key}</span>
                  <span className="ml-2 truncate text-muted-foreground">
                    {issue.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
