"use client";

import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  aside?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, aside, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a1a1a6]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f] sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[#6e6e73]">
            {description}
          </p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
