import * as React from "react";

import { cn } from "../../utils/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80",
        className
      )}
      {...props}
    />
  );
}
