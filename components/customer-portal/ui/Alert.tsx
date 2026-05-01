"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ColorVariant } from "./tokens";

const alertStyles: Record<ColorVariant, { wrapper: string; icon: string; IconComponent: typeof Info }> = {
  danger:  { wrapper: "border-red-200     bg-red-50",     icon: "text-red-500",     IconComponent: AlertCircle    },
  warning: { wrapper: "border-amber-200   bg-amber-50",   icon: "text-amber-500",   IconComponent: AlertTriangle  },
  success: { wrapper: "border-emerald-200 bg-emerald-50", icon: "text-emerald-500", IconComponent: CheckCircle2   },
  info:    { wrapper: "border-sky-200     bg-sky-50",     icon: "text-sky-500",     IconComponent: Info           },
  accent:  { wrapper: "border-indigo-200  bg-indigo-50",  icon: "text-indigo-500",  IconComponent: Info           },
  neutral: { wrapper: "border-zinc-200    bg-zinc-50",    icon: "text-zinc-400",    IconComponent: Info           },
};

export type AlertProps = {
  variant?: ColorVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

export function Alert({
  variant = "info",
  title,
  children,
  action,
  onDismiss,
  className = "",
}: AlertProps) {
  const style = alertStyles[variant];
  const { IconComponent } = style;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${style.wrapper} ${className}`}
    >
      <IconComponent className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-[#1d1d1f]">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5 text-[#6e6e73]" : ""}>{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-md p-0.5 text-[#6e6e73] transition hover:bg-black/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
