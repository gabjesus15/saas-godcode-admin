import * as React from "react";

import { cn } from "../../utils/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-zinc-200/70", className)}
      {...props}
    />
  );
}
