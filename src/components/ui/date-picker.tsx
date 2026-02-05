"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  id,
  name,
}: DatePickerProps) {
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onChange(new Date(value));
    } else {
      onChange(null);
    }
  };

  return (
    <Input
      type="date"
      id={id}
      name={name}
      value={formatDateForInput(value)}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "block w-full",
        !value && "text-muted-foreground",
        className
      )}
    />
  );
}
