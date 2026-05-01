"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f7]">
          <Icon className="h-6 w-6 text-[#a1a1a6]" aria-hidden />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-[#1d1d1f]">{title}</p>
        {description && (
          <p className="mt-1 max-w-xs text-sm text-[#6e6e73]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
