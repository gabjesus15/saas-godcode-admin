"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  /** Color del icono y acento superior. Por defecto "indigo". */
  accent?: "indigo" | "emerald" | "amber" | "red" | "sky";
  /** Convierte la tarjeta en un botón clickeable. */
  onClick?: () => void;
  className?: string;
};

const accentMap = {
  indigo:  { bar: "bg-indigo-500",  icon: "text-indigo-500",  iconBg: "bg-indigo-50"  },
  emerald: { bar: "bg-emerald-500", icon: "text-emerald-600", iconBg: "bg-emerald-50" },
  amber:   { bar: "bg-amber-500",   icon: "text-amber-600",   iconBg: "bg-amber-50"   },
  red:     { bar: "bg-red-500",     icon: "text-red-600",     iconBg: "bg-red-50"     },
  sky:     { bar: "bg-sky-500",     icon: "text-sky-600",     iconBg: "bg-sky-50"     },
};

export function StatCard({ label, value, sub, icon: Icon, accent = "indigo", onClick, className = "" }: StatCardProps) {
  const a = accentMap[accent];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group flex flex-col rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-sm shadow-indigo-500/[0.03] transition-shadow ${onClick ? "cursor-pointer hover:shadow-md hover:shadow-indigo-500/10 active:scale-[0.99]" : ""} ${className}`}
    >
      <div className="mb-4 h-px w-8 rounded-full transition-all group-hover:w-12" style={{ background: `var(--accent-bar, #6366f1)` }}>
        <div className={`h-px w-full rounded-full ${a.bar}`} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#a1a1a6]">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-[#1d1d1f]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#6e6e73]">{sub}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl p-2.5 ${a.iconBg}`}>
            <Icon className={`h-5 w-5 ${a.icon}`} aria-hidden />
          </div>
        )}
      </div>
    </Tag>
  );
}
