import { Star } from "lucide-react";

import { LandingReveal } from "./landing-reveal";

const testimonials = [
  {
    name: "Carolina M.",
    business: "Sabores de Casa",
    text: "Antes perdía pedidos por WhatsApp. Ahora cada orden queda registrada, mis clientes piden solos y yo solo preparo. Fue un cambio total.",
    avatar: "CM",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    name: "Diego R.",
    business: "MiniMarket Express",
    text: "Tenemos 2 sucursales y cada una maneja su inventario. Antes usábamos Excel y se nos olvidaba actualizar. Esto nos ahorró horas a la semana.",
    avatar: "DR",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    name: "Valentina S.",
    business: "V&S Café",
    text: "Lo que más me gustó es que mis clientes ven el menú bonito desde su celular. Las fotos, los precios, todo ordenado. Ya no mando PDFs por WhatsApp.",
    avatar: "VS",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
] as const;

export function LandingTestimonials() {
  return (
    <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
      {testimonials.map((t, i) => (
        <LandingReveal key={t.name} delay={i * 0.1}>
          <div className="flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${t.color}`}>
                {t.avatar}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-500">{t.business}</p>
              </div>
            </div>
          </div>
        </LandingReveal>
      ))}
    </div>
  );
}
