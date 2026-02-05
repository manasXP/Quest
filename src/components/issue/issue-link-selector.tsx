"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssueType, LinkType } from "@prisma/client";

interface Issue {
  id: string;
  key: string;
  title: string;
  type: IssueType;
}

interface IssueLink {
  type: LinkType;
  issueId: string;
}

interface IssueLinkSelectorProps {
  issues: Issue[];
  links: IssueLink[];
  onChange: (links: IssueLink[]) => void;
  disabled?: boolean;
  excludeId?: string;
}

const linkTypeLabels: Record<LinkType, string> = {
  BLOCKS: "blocks",
  IS_BLOCKED_BY: "is blocked by",
  RELATES_TO: "relates to",
  DUPLICATES: "duplicates",
  IS_DUPLICATED_BY: "is duplicated by",
};

const typeColors: Record<IssueType, string> = {
  EPIC: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  STORY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TASK: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  BUG: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function IssueLinkSelector({
  issues,
  links,
  onChange,
  disabled,
  excludeId,
}: IssueLinkSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType>("RELATES_TO");

  const linkedIssueIds = links.map((link) => link.issueId);
  const availableIssues = issues.filter(
    (issue) => issue.id !== excludeId && !linkedIssueIds.includes(issue.id)
  );

  const addLink = (issueId: string) => {
    onChange([...links, { type: selectedLinkType, issueId }]);
    setOpen(false);
  };

  const removeLink = (issueId: string) => {
    onChange(links.filter((link) => link.issueId !== issueId));
  };

  const getIssueById = (issueId: string) =>
    issues.find((issue) => issue.id === issueId);

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className="space-y-1.5">
          {links.map((link) => {
            const issue = getIssueById(link.issueId);
            if (!issue) return null;
            return (
              <div
                key={link.issueId}
                className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1.5 text-sm"
              >
                <span className="text-muted-foreground shrink-0">
                  {linkTypeLabels[link.type]}
                </span>
                <Badge
                  variant="secondary"
                  className={cn("text-xs shrink-0", typeColors[issue.type])}
                >
                  {issue.type}
                </Badge>
                <span className="font-medium shrink-0">{issue.key}</span>
                <span className="truncate text-muted-foreground flex-1">
                  {issue.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeLink(link.issueId)}
                  disabled={disabled}
                  className="shrink-0 hover:bg-muted rounded p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={selectedLinkType}
          onValueChange={(value) => setSelectedLinkType(value as LinkType)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(linkTypeLabels) as LinkType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {linkTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || availableIssues.length === 0}
              className="flex-1 justify-start text-muted-foreground font-normal"
            >
              <Plus className="mr-2 h-4 w-4" />
              Link issue
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
                      onSelect={() => addLink(issue.id)}
                    >
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
      </div>
    </div>
  );
}
