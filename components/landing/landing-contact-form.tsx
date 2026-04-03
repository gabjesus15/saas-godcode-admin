"use client";

import { useMemo, useState } from "react";

import { Button } from "../ui/button";

export function LandingContactForm({ supportEmail }: { supportEmail: string }) {
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

    // Abrimos el cliente de correo con el contenido precargado.
    window.location.href = `${mailtoBase}?subject=${subject}&body=${body}`;

    // Damos margen a que el navegador ejecute el mailto. La acción no “termina” en el browser.
    setTimeout(() => setSubmitting(false), 500);
  };

  return (
    <form suppressHydrationWarning onSubmit={onSubmit} className="mt-5 space-y-3 sm:mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-800 dark:text-zinc-200">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/30 dark:focus:ring-indigo-500/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-800 dark:text-zinc-200">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/30 dark:focus:ring-indigo-500/20"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-800 dark:text-zinc-200">
        Mensaje
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Cuéntanos tu rubro, tu ciudad y qué te gustaría lograr con tu tienda/menu."
          className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-200/60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-500/30 dark:focus:ring-indigo-500/20"
        />
      </label>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-10 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-auto"
      >
        {submitting ? "Preparando correo..." : "Enviar mensaje"}
      </Button>
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Esto abre tu cliente de email con la consulta precargada.
      </p>
    </form>
  );
}

