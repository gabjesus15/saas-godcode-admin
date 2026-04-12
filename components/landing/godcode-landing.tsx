import Link from "next/link";

import type { LandingMediaBundle } from "../../lib/landing-media-types";
import type { PublicPlanForLanding } from "../../lib/public-plans";
import type { CountryCode } from "../../lib/landing-geo-plans"; // Usamos country para detectar continente

import { LandingNav } from "./landing-nav";
import { LandingSections } from "./landing-sections";
import { LandingScrollToTop } from "./landing-scroll-to-top";
import { FloatingWhatsappButton } from "./floating-whatsapp-button";

type GodcodeLandingProps = {
  plans: PublicPlanForLanding[];
  media: LandingMediaBundle;
  country?: CountryCode;
};

export function GodcodeLanding({ plans, media, country = "OTHER" }: GodcodeLandingProps) {
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hola@godcode.me";
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      <LandingNav />
      <LandingSections plans={plans} media={media} country={country} />

      <footer className="relative z-10 bg-black px-5 py-12 text-slate-400 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Top: logo + columns */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-x-8 lg:gap-y-12">
            {/* Brand */}
            <div className="min-w-0 sm:col-span-2 sm:border-b sm:border-slate-800/60 sm:pb-10 lg:col-span-1 lg:border-b-0 lg:pb-0">
              <a href="#inicio" className="inline-flex items-center gap-1.5" aria-label="GodCode">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect width="28" height="28" rx="8" fill="#6366f1" />
                  <path d="M8 10.5h5.5a2.5 2.5 0 010 5H11v3" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="19" cy="17.5" r="2.5" fill="#c4b5fd" />
                </svg>
                <span className="text-lg font-bold tracking-tight text-white">
                  God<span className="text-indigo-400">Code</span>
                </span>
              </a>
              <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-slate-500 sm:max-w-xl lg:max-w-xs">
                Todo lo que tu negocio necesita para vender online. Menú, carrito, caja, inventario y más.
              </p>
              <a
                href={`mailto:${support}`}
                className="mt-4 inline-flex text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                {support}
              </a>
            </div>

            {/* Producto */}
            <div className="min-w-0 border-t border-slate-800/70 pt-8 sm:border-t-0 sm:pt-0 lg:border-t-0 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Producto</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/onboarding" className="transition-colors hover:text-white">Crear tienda</Link></li>
                <li><a href="#funciones" className="transition-colors hover:text-white">Funciones</a></li>
                <li><a href="#demo" className="transition-colors hover:text-white">Demo</a></li>
                <li><a href="#precios" className="transition-colors hover:text-white">Precios</a></li>
                <li><a href="#como-funciona" className="transition-colors hover:text-white">Cómo funciona</a></li>
                <li><a href="#comparar" className="transition-colors hover:text-white">Comparar</a></li>
                <li><a href="#testimonios" className="transition-colors hover:text-white">Testimonios</a></li>
              </ul>
            </div>

            {/* Soporte */}
            <div className="min-w-0 border-t border-slate-800/70 pt-8 sm:border-t-0 sm:pt-0 lg:border-t-0 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Soporte</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#faq" className="transition-colors hover:text-white">FAQ</a></li>
                <li><a href="#contacto" className="transition-colors hover:text-white">Contacto</a></li>
                <li><Link href="/login" className="transition-colors hover:text-white">Iniciar sesión</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="min-w-0 border-t border-slate-800/70 pt-8 sm:col-span-2 sm:pt-8 lg:col-span-1 lg:border-t-0 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/onboarding/terminos" className="transition-colors hover:text-white">Términos de servicio</Link></li>
                <li><Link href="/onboarding/privacidad" className="transition-colors hover:text-white">Política de privacidad</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center gap-3 border-t border-slate-800/80 pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} GodCode · godcode.me
            </p>
            <a
              href="#inicio"
              className="text-xs text-slate-600 transition-colors hover:text-slate-400"
            >
              Volver arriba ↑
            </a>
          </div>
        </div>
      </footer>

      <LandingScrollToTop />
      <FloatingWhatsappButton phoneNumber="56943848080" />
    </div>
  );
}
