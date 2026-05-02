"use client";

import type { ReactNode } from "react";

export type CardProps = {
  children: ReactNode;
  className?: string;
  /** Padding más compacto para tarjetas secundarias. */
  compact?: boolean;
  /** Elimina el padding interno. Útil cuando el hijo maneja su propio espaciado. */
  noPadding?: boolean;
};

export function Card({ children, className = "", compact = false, noPadding = false }: CardProps) {
  const padding = noPadding ? "" : compact ? "p-3.5 sm:p-4" : "p-4 sm:p-6 md:p-8";
  return (
    <div
      className={`rounded-2xl border border-[#e5e5ea] bg-white shadow-sm shadow-indigo-500/[0.03] ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
