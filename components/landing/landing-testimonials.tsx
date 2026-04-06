import { Star } from "lucide-react";

import { LandingReveal } from "./landing-reveal";

const testimonials = [
  {
    name: "Carolina M.",
    business: "Sabores de Casa",
    text: "Antes perdía pedidos por WhatsApp. Ahora cada orden queda registrada, mis clientes piden solos y yo solo preparo. Fue un cambio total.",
    avatar: "CM",
    color: "bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-300/30",
  },
  {
    name: "Diego R.",
    business: "MiniMarket Express",
    text: "Tenemos 2 sucursales y cada una maneja su inventario. Antes usábamos Excel y se nos olvidaba actualizar. Esto nos ahorró horas a la semana.",
    avatar: "DR",
    color: "bg-violet-500/20 text-violet-100 ring-1 ring-violet-300/30",
  },
  {
    name: "Valentina S.",
    business: "V&S Café",
    text: "Lo que más me gustó es que mis clientes ven el menú bonito desde su celular. Las fotos, los precios, todo ordenado. Ya no mando PDFs por WhatsApp.",
    avatar: "VS",
    color: "bg-blue-500/20 text-blue-100 ring-1 ring-blue-300/30",
  },
] as const;

export function LandingTestimonials() {
  return (
    <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
      {testimonials.map((t, i) => (
        <LandingReveal key={t.name} delay={i * 0.1}>
          <div className="flex h-full flex-col rounded-2xl border border-indigo-300/20 bg-slate-950/45 p-5 shadow-[0_20px_60px_-34px_rgba(0,0,0,0.85)] backdrop-blur-md transition hover:-translate-y-1 hover:border-indigo-300/30 sm:p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-indigo-100/75">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-indigo-300/15 pt-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${t.color}`}>
                {t.avatar}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-indigo-200/65">{t.business}</p>
              </div>
            </div>
          </div>
        </LandingReveal>
      ))}
    </div>
  );
}
