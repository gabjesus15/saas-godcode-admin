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
    <div
      className={`flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#a1a1a6]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#1d1d1f] sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[#6e6e73] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {aside && (
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{aside}</div>
      )}
    </div>
  );
}
