"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function LandingLeadForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600">
        <Check className="h-4 w-4" aria-hidden />
        Te avisaremos a {email}
      </p>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubmitted(true);
      }}
    >
      <label className="sr-only" htmlFor="lead-email">Tu correo electrónico</label>
      <input
        id="lead-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/40"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
      >
        Avísame
      </button>
    </form>
  );
}
