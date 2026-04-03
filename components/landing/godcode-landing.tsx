import Link from "next/link";

import type { PublicPlanForLanding } from "../../lib/public-plans";

import { LandingNav } from "./landing-nav";
import { LandingSections } from "./landing-sections";

type GodcodeLandingProps = {
  plans: PublicPlanForLanding[];
};

export function GodcodeLanding({ plans }: GodcodeLandingProps) {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hola@godcode.me";
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      <LandingNav />
      <LandingSections plans={plans} />

      <footer className="relative z-10 border-t border-slate-800/80 bg-gradient-to-b from-slate-900 to-black px-5 py-10 text-slate-400 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Producto</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/onboarding" className="transition-colors hover:text-white">
                  Crear tienda
                </Link>
              </li>
              <li>
                <a href="#funciones" className="transition-colors hover:text-white">
                  Funciones
                </a>
              </li>
              <li>
                <a href="#precios" className="transition-colors hover:text-white">
                  Precios
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recursos</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="#como-funciona" className="transition-colors hover:text-white">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contacto" className="transition-colors hover:text-white">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/onboarding/terminos" className="transition-colors hover:text-white">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/onboarding/privacidad" className="transition-colors hover:text-white">
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contacto</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              ¿Dudas antes de empezar? Escríbenos.
            </p>
            <a
              href={`mailto:${support}`}
              className="mt-3 inline-flex text-sm font-semibold text-white transition-colors hover:text-indigo-300"
            >
              {support}
            </a>
            <p className="mt-5 text-xs text-slate-500 sm:mt-6 sm:text-sm">© {new Date().getFullYear()} GodCode · godcode.me</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
