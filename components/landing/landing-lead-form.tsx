"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { cn } from "../../utils/cn";

export function LandingLeadForm({
  dark = false,
  className,
  layout = "inline",
}: {
  dark?: boolean;
  className?: string;
  /** `stacked`: columna y controles a ancho completo (tarjetas estrechas) */
  layout?: "inline" | "stacked";
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <p
        className={cn(
          "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium",
          dark ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-400",
          className,
        )}
      >
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        <span>Te avisaremos a {email}</span>
      </p>
    );
  }

  const inputCls = dark
    ? "h-11 min-w-0 flex-1 rounded-xl border border-slate-600/80 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
    : "h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/40";

  const btnCls = dark
    ? cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-md shadow-indigo-950/40 transition hover:bg-indigo-500 sm:px-8",
        layout === "stacked" ? "h-12 w-full" : "h-11 w-full sm:w-auto",
      )
    : "inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200";

  const rowCls =
    dark && layout === "stacked"
      ? "flex flex-col gap-3"
      : "flex flex-col gap-3 sm:flex-row sm:items-stretch";

  const darkInputStacked =
    dark && layout === "stacked"
      ? "h-12 w-full rounded-xl border border-slate-600/80 bg-slate-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
      : null;

  return (
    <form
      className={cn("flex flex-col gap-3", className)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim() || loading) return;
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/landing/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error ?? "No se pudo guardar tu correo.");
          }
          setSubmitted(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo guardar tu correo.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className={rowCls}>
        <label className="sr-only" htmlFor="lead-email">
          Tu correo electrónico
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className={darkInputStacked ?? inputCls}
        />
        <button type="submit" className={btnCls}>
          {loading ? "Guardando..." : "Avísame"}
        </button>
      </div>
      {error ? (
        <p className={cn("text-xs", dark ? "text-red-300" : "text-red-600")}>{error}</p>
      ) : null}
      {dark ? (
        <p className="text-center text-[11px] leading-relaxed text-slate-500 sm:text-left">
          No compartimos tu correo con terceros. Puedes darte de baja cuando quieras.
        </p>
      ) : null}
    </form>
  );
}
