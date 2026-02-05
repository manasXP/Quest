"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelSelectorProps {
  labels: Label[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function LabelSelector({
  labels,
  selectedIds,
  onChange,
  disabled,
  placeholder = "Select labels...",
}: LabelSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedLabels = labels.filter((label) =>
    selectedIds.includes(label.id)
  );

  const toggleLabel = (labelId: string) => {
    if (selectedIds.includes(labelId)) {
      onChange(selectedIds.filter((id) => id !== labelId));
    } else {
      onChange([...selectedIds, labelId]);
    }
  };

  const removeLabel = (labelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== labelId));
  };

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
            selectedLabels.length === 0 && "text-muted-foreground"
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selectedLabels.length === 0 && placeholder}
            {selectedLabels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="gap-1 pr-1"
                style={{
                  backgroundColor: `${label.color}20`,
                  borderColor: label.color,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
                <button
                  type="button"
                  onClick={(e) => removeLabel(label.id, e)}
                  className="ml-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="space-y-1">
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 px-2">
              No labels available
            </p>
          ) : (
            labels.map((label) => {
              const isSelected = selectedIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted",
                    isSelected && "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="truncate">{label.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
