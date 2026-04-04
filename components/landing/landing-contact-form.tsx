"use client";

import { useMemo, useState } from "react";

import { cn } from "../../utils/cn";
import { Button } from "../ui/button";

export function LandingContactForm({
  supportEmail,
  dark = false,
  className,
}: {
  supportEmail: string;
  dark?: boolean;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mailtoBase = useMemo(() => {
    const to = supportEmail.trim();
    return `mailto:${to}`;
  }, [supportEmail]);

  const canSubmit = message.trim().length >= 10 && !submitting;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const subject = encodeURIComponent("Consulta sobre GodCode");
    const body = encodeURIComponent(
      [
        `Nombre: ${name.trim() || "-"}`,
        `Email: ${email.trim() || "-"}`,
        "",
        "Mensaje:",
        message.trim(),
        "",
        "Enviado desde godcode.me (landing).",
      ].join("\n"),
    );

    window.location.href = `${mailtoBase}?subject=${subject}&body=${body}`;
    setTimeout(() => setSubmitting(false), 500);
  };

  const inputCls = dark
    ? "h-11 rounded-xl border border-slate-600/80 bg-slate-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
    : "h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/30 dark:focus:ring-indigo-500/20";

  const labelCls = dark
    ? "flex flex-col gap-1 text-sm font-medium text-slate-300"
    : "flex flex-col gap-1 text-sm font-medium text-slate-800 dark:text-zinc-200";

  const textareaCls = dark
    ? "resize-none rounded-xl border border-slate-600/80 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
    : "resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/30 dark:focus:ring-indigo-500/20";

  return (
    <form suppressHydrationWarning onSubmit={onSubmit} className={cn("mt-6 space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Nombre
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className={inputCls}
          />
        </label>
      </div>
      <label className={labelCls}>
        Mensaje
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={dark ? 3 : 4}
          placeholder="Cuéntanos tu rubro, tu ciudad y qué te gustaría lograr con tu tienda/menu."
          className={textareaCls}
        />
      </label>

      <Button
        type="submit"
        variant={dark ? "ghost" : "default"}
        disabled={!canSubmit}
        className={cn(
          dark
            ? "h-11 w-full border-0 bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-950/35 hover:bg-indigo-500 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent disabled:opacity-60 sm:h-12"
            : "h-10 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-auto",
        )}
      >
        {submitting ? "Preparando correo..." : "Enviar mensaje"}
      </Button>
      <p className={cn("text-xs", dark ? "text-slate-500" : "text-slate-500 dark:text-zinc-400")}>
        Esto abre tu cliente de email con la consulta precargada.
      </p>
    </form>
  );
}
