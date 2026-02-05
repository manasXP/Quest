"use client";

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
import { useState } from "react";
import type { SprintStatus } from "@prisma/client";

interface Sprint {
  id: string;
  name: string;
  status: SprintStatus;
}

interface SprintSelectorProps {
  sprints: Sprint[];
  value?: string | null;
  onChange: (sprintId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const statusColors: Record<SprintStatus, { bg: string; text: string }> = {
  PLANNED: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  ACTIVE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  COMPLETED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
};

export function SprintSelector({
  sprints,
  value,
  onChange,
  disabled,
  placeholder = "Select sprint...",
}: SprintSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter to only show PLANNED and ACTIVE sprints for selection
  const availableSprints = sprints.filter(
    (s) => s.status === "PLANNED" || s.status === "ACTIVE"
  );

  const selectedSprint = sprints.find((sprint) => sprint.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedSprint && "text-muted-foreground"
          )}
        >
          {selectedSprint ? (
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedSprint.name}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs capitalize",
                  statusColors[selectedSprint.status].bg,
                  statusColors[selectedSprint.status].text
                )}
              >
                {selectedSprint.status.toLowerCase()}
              </Badge>
            </div>
          ) : (
            placeholder
          )}
          <div className="flex items-center gap-1">
            {selectedSprint && (
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
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search sprints..." />
          <CommandList>
            <CommandEmpty>No sprints found</CommandEmpty>
            <CommandGroup>
              {availableSprints.map((sprint) => (
                <CommandItem
                  key={sprint.id}
                  value={sprint.name}
                  onSelect={() => {
                    onChange(sprint.id === value ? null : sprint.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === sprint.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{sprint.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2 text-xs capitalize",
                      statusColors[sprint.status].bg,
                      statusColors[sprint.status].text
                    )}
                  >
                    {sprint.status.toLowerCase()}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
