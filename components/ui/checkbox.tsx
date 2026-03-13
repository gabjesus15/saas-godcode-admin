"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-zinc-200 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-500",
          className
        )}
        ref={ref}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
