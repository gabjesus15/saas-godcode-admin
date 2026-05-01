"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-sm",
  secondary: "border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] active:scale-[0.98]",
  ghost:     "text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] active:scale-[0.98]",
  danger:    "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-xs font-medium",
  md: "h-9 rounded-xl px-4 text-sm font-medium",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
