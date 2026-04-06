import { ArrowRight, Play, Sparkles } from "lucide-react";

import { LandingReveal } from "./landing-reveal";

export function LandingDemoSection() {
  return (
    <section
      id="demo"
      className="relative scroll-mt-20 overflow-hidden border-y border-indigo-500/20 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_50%_58%,rgba(37,99,235,0.2),transparent_38%),linear-gradient(180deg,#0f172a_0%,#070d1d_100%)] py-14 sm:py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[-8rem] top-[10%] h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-[-7rem] top-[18%] h-80 w-80 rounded-full bg-violet-500/22 blur-3xl" />
        <div className="absolute left-1/2 top-[70%] h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <LandingReveal>
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">
              Demo
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[3rem]">
              Mira el producto en acción
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-indigo-100/75 sm:text-base">
              Esta sección está pensada para mostrar nuestro recorrido completo: menú, carrito, pedidos, caja e inventario en una sola presentación.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contacto"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
              >
                Pedir una demo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </LandingReveal>

        <LandingReveal delay={0.08} direction="right">
          <div className="relative overflow-hidden rounded-[2rem] border border-indigo-300/20 bg-slate-950/45 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" aria-hidden />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Vista previa</p>
                <h3 className="mt-1 text-lg font-bold text-white">Demo del producto</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-indigo-300/25">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Preparada por nosotros
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-inner">
              <div className="relative aspect-video w-full overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]" />
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white/10 text-indigo-200 ring-1 ring-white/10 backdrop-blur-sm">
                      <Play className="h-7 w-7 fill-current" aria-hidden />
                    </div>
                    <p className="mt-5 text-sm font-semibold text-white">Video demo del producto</p>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-300">
                      Aquí irá el video final mostrando el flujo completo de GodCode. Ideal para presentar la plataforma en ventas o landing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
