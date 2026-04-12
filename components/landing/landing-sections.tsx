import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  Mail,
  MessageSquare,
  Minus,
  Play,
  Plus,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

import type { LandingMediaBundle } from "../../lib/landing-media-types";
import { popularPlanIndex, type PublicPlanForLanding } from "../../lib/public-plans";
import { cn } from "../../utils/cn";
import { Card } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { LandingReveal } from "./landing-reveal";
import { LandingFeatureBlock } from "./landing-feature-block";
import { LandingTestimonials } from "./landing-testimonials";
import { LaptopFrame, PhoneFrame } from "./landing-device-frame";
import { LandingFeatureShot } from "./landing-feature-shot";
import { LandingAnimatedGrid } from "./landing-animated-grid";
import { LandingPhoneCarousel } from "./landing-phone-carousel";
import { LandingContactForm } from "./landing-contact-form";
import { LandingLeadForm } from "./landing-lead-form";
import { LandingVideoPlayer } from "./landing-video-player";

const usdMonth = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hola@godcode.me";
}

/* ───── Shared UI ───── */

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400", className)}>
      {children}
    </p>
  );
}

function SectionShell({
  id,
  variant = "default",
  className,
  children,
}: {
  id?: string;
  variant?: "default" | "white" | "muted" | "dark" | "gradient";
  className?: string;
  children: React.ReactNode;
}) {
  const bg = {
    default: "bg-transparent",
    white: "bg-white dark:bg-zinc-950",
    muted: "bg-slate-50 dark:bg-zinc-950",
    dark: "bg-slate-900 dark:bg-zinc-950",
    gradient: "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700",
  }[variant];
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 min-h-[100svh] py-14 sm:py-20 md:py-24", bg, className)}
    >
      {children}
    </section>
  );
}

/* ───── Data ───── */

const steps = [
  { n: "1", title: "Regístrate", text: "Crea tu cuenta con email. Sin tarjeta de crédito." },
  { n: "2", title: "Arma tu tienda", text: "Sube productos, configura delivery y sucursales." },
  { n: "3", title: "Empieza a vender", text: "Comparte tu link y recibe pedidos desde el día 1." },
] as const;

const compareRows = [
  { feature: "Comisión por venta", ig: "No aplica", rappi: "25-30%", custom: "0%", gc: "0%" },
  { feature: "Control de clientes", ig: false, rappi: false, custom: true, gc: true },
  { feature: "Tu propia marca", ig: false, rappi: false, custom: true, gc: true },
  { feature: "Tiempo de setup", ig: "1 día", rappi: "1-2 sem.", custom: "2-6 meses", gc: "5 min" },
  { feature: "Costo mensual", ig: "Gratis*", rappi: "Gratis*", custom: "$500+", gc: "Desde $20" },
  { feature: "Inventario y caja", ig: false, rappi: false, custom: true, gc: true },
] as const;

const faqItems = [
  { q: "¿No sé nada de tecnología, puedo usarlo?", a: "Sí. No necesitas programar ni saber de servidores. Te registras, subes tus productos y tu tienda está lista. Si tienes dudas, nuestro soporte te guía." },
  { q: "¿Cuánto cuesta realmente?", a: "Los precios están en la sección de planes arriba. No hay costos ocultos, comisiones por venta ni cargos sorpresa." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Sin penalidad, sin permanencia mínima. Si no te sirve, cancelas y listo." },
  { q: "¿Mis datos están seguros?", a: "Usamos encriptación SSL, servidores protegidos y cada negocio tiene sus datos completamente aislados. Nadie más puede ver tu información." },
  { q: "¿Cuánto tardo en tener mi tienda lista?", a: "Si ya tienes tus productos y fotos, menos de 1 hora. El proceso de registro toma 5 minutos." },
  { q: "¿Puedo tener varias sucursales?", a: "Sí. Cada sucursal tiene su propio inventario, precios, zona de delivery y horarios." },
] as const;

/* ───── Main ───── */

export function LandingSections({
  plans,
  media,
}: {
  plans: PublicPlanForLanding[];
  media: LandingMediaBundle;
}) {
  const support = getSupportEmail();
  const popularIdx = popularPlanIndex(plans.length);

  return (
    <main className="relative z-10">

      {/* ════ 1. HERO ════ */}
      <section
        id="inicio"
        className="relative scroll-mt-20 flex min-h-[92svh] items-center overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgb(226_232_240_/_0.4)_1px,transparent_0)] bg-[length:24px_24px] py-10 sm:py-14 md:py-16 lg:py-20"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-zinc-950 dark:via-indigo-950/10 dark:to-zinc-950" />
        <div className="landing-hero-aurora landing-hero-aurora--one" aria-hidden />
        <div className="landing-hero-aurora landing-hero-aurora--two" aria-hidden />
        <div className="landing-hero-aurora landing-hero-aurora--three" aria-hidden />
        <div className="landing-hero-sheen" aria-hidden />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-5 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <LandingReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-medium text-indigo-700 backdrop-blur sm:px-4 sm:text-xs dark:border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                </span>
                Lanzamiento: beneficios para primeros negocios (cupos limitados)
              </span>
            </LandingReveal>

            <LandingReveal delay={0.08}>
              <h1 className="mt-5 text-[1.7rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3.25rem] dark:text-white">
                Todo lo que tu negocio necesita para{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                  vender online
                </span>
              </h1>
            </LandingReveal>

            <LandingReveal delay={0.14}>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg dark:text-zinc-400">
                Menú digital, carrito, delivery, caja, comandas e inventario.
                <strong className="font-semibold text-slate-800 dark:text-zinc-200"> Crea tu tienda en minutos</strong>, sin programar.
              </p>
            </LandingReveal>

            <LandingReveal delay={0.2}>
              <div className="mt-7 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 sm:h-[3.25rem] sm:w-auto sm:px-8 sm:text-base"
                >
                  Empezar gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 sm:text-sm lg:text-left dark:text-zinc-500">
                Sin tarjeta de crédito · Cancela cuando quieras
              </p>
              <p className="mt-1 text-center text-[11px] text-slate-400 sm:text-xs lg:text-left dark:text-zinc-500">
                Descuento de lanzamiento sujeto a disponibilidad y validación de rubro.
              </p>
            </LandingReveal>

            <LandingReveal delay={0.28}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:gap-x-6 sm:text-sm lg:justify-start dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />Datos protegidos</span>
                <span className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />Pagos seguros</span>
                <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />Tu dominio propio</span>
              </div>
            </LandingReveal>
          </div>

          <div className="order-1 w-full lg:order-2">
            <LandingReveal delay={0.1} direction="right">
              <div className="relative mx-auto max-w-[28rem] pb-4 sm:max-w-lg sm:pb-10 lg:max-w-none">
                <LaptopFrame
                  src={media.hero.laptopSrc}
                  alt={media.hero.laptopAlt}
                  priority
                />
                <div className="absolute -bottom-2 -left-2 z-10 hidden sm:block sm:-bottom-4 sm:-left-6 lg:-left-10">
                  <PhoneFrame
                    className="!max-w-[108px] sm:!max-w-[152px] lg:!max-w-[184px]"
                    src={media.hero.phoneSrc}
                    alt={media.hero.phoneAlt}
                    priority
                  />
                </div>
              </div>
            </LandingReveal>
          </div>
        </div>
      </section>

      {/* wave: white → dark — fill-current = mismo token que bg-slate-900 de la sección; -mt-px evita halo por antialiasing */}
      <div className="relative -my-2 h-8 overflow-hidden bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-950 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-x-0 top-[-1px] block h-[calc(100%+2px)] w-full">
          <path d="M0 22C240 52 480 54 720 36S1200 0 1440 18V54H0Z" className="fill-current" />
        </svg>
      </div>

      {/* ════ 2. TRUST STRIP + KPIs ════ */}
      <SectionShell variant="dark" className="-mt-px min-h-0 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <LandingReveal>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-400 sm:gap-x-12">
              <span className="inline-flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-indigo-400" aria-hidden />Múltiples métodos de pago</span>
              <span className="inline-flex items-center gap-2 font-medium"><Shield className="h-4 w-4 text-indigo-400" aria-hidden />Cifrado SSL</span>
              <span className="inline-flex items-center gap-2 font-medium"><Headphones className="h-4 w-4 text-indigo-400" aria-hidden />Soporte humano por email (&lt;24h)</span>
            </div>
          </LandingReveal>

          <LandingReveal delay={0.1}>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-4">
              {([
                { title: "Sin comisión", label: "0% por venta en todos los planes" },
                { title: "Setup rápido", label: "Configuración guiada en minutos" },
                { title: "Sin amarras", label: "Cancela cuando quieras" },
                { title: "Soporte real", label: "Respuesta humana por correo" },
              ] as const).map((kpi) => (
                <div key={kpi.title} className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4 text-center">
                  <p className="text-base font-semibold text-white sm:text-lg">{kpi.title}</p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">{kpi.label}</p>
                </div>
              ))}
            </div>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* wave: dark → white */}
      <div className="relative -my-2 h-8 overflow-hidden bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-950 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-x-0 top-[-1px] block h-[calc(100%+2px)] w-full">
          <path d="M0 32C360 4 720 0 1080 22S1380 52 1440 40V0H0Z" className="fill-current" />
        </svg>
      </div>

      {/* ════ 3. FEATURE SPOTLIGHTS ════ */}
      <SectionShell id="funciones" variant="white" className="-mt-px">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Todo incluido</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Una sola plataforma, todo lo que necesitas
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500 sm:text-base dark:text-zinc-400">
              Deja de pagar por 5 herramientas distintas. Aquí está todo.
            </p>
          </LandingReveal>
        </div>

        <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
          <LandingFeatureBlock
            eyebrow="Ventas online"
            title="Menú digital y carrito inteligente"
            description="Tus clientes ven el menú desde su celular, eligen productos, personalizan extras y pagan online. Todo sin que levantes el teléfono."
            bullets={[
              "Categorías, fotos y precios por sucursal",
              "Carrito con totales automáticos y extras",
              "Checkout rápido desde cualquier celular",
            ]}
            visual={
              <LandingFeatureShot
                src={media.features.menu.src}
                alt={media.features.menu.alt}
              />
            }
          />

          <LandingFeatureBlock
            eyebrow="Operaciones"
            title="Punto de venta y caja registradora"
            description="Cobra en tu local con un sistema rápido y simple. Turnos de caja, métodos de pago y resumen de ventas en un solo lugar."
            bullets={[
              "POS táctil rápido e intuitivo",
              "Turnos de caja con apertura y cierre",
              "Múltiples métodos de pago",
            ]}
            visual={
              <LandingFeatureShot
                src={media.features.pos.src}
                alt={media.features.pos.alt}
              />
            }
            reversed
            delay={0.05}
          />

          <LandingFeatureBlock
            eyebrow="Inventario"
            title="Stock y control por sucursal"
            description="Mantén inventario, recetas y movimientos sincronizados para evitar quiebres de stock y errores al vender."
            bullets={[
              "Stock en tiempo real por sucursal",
              "Alertas de inventario bajo",
              "Recetas: descuento automático al vender",
              "Historial completo de movimientos",
            ]}
            visual={
              <LandingFeatureShot
                src={media.features.inventory.src}
                alt={media.features.inventory.alt}
              />
            }
            delay={0.1}
          />
        </div>
      </SectionShell>

      {/* ════ 4. CÓMO FUNCIONA ════ */}
      <SectionShell
        id="como-funciona"
        variant="dark"
        className="relative min-h-0 overflow-hidden border-y border-indigo-500/20 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_50%_58%,rgba(37,99,235,0.2),transparent_38%),linear-gradient(180deg,#0f172a_0%,#070d1d_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute left-[-8rem] top-[10%] h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute right-[-7rem] top-[22%] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-[58%] h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end lg:gap-12">
            <LandingReveal>
              <div className="max-w-2xl">
                <Eyebrow className="text-left !text-indigo-300">Cómo funciona</Eyebrow>
                <h2 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[3rem]">
                  Tu tienda lista en minutos
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-indigo-100/80 sm:text-base">
                  Un flujo corto y claro para pasar de idea a ventas sin fricción. Sin configuraciones pesadas, sin curva técnica y sin perder tiempo en pasos innecesarios.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 shadow-sm backdrop-blur-sm">
                    <Check className="h-3.5 w-3.5 text-indigo-200" aria-hidden />
                    Sin tarjeta de crédito
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 shadow-sm backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5 text-violet-200" aria-hidden />
                    En menos de 5 minutos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 shadow-sm backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5 text-blue-200" aria-hidden />
                    Soporte incluido
                  </span>
                </div>
              </div>
            </LandingReveal>

            <LandingReveal delay={0.05} direction="right">
              <div className="relative overflow-hidden rounded-[2rem] border border-indigo-300/20 bg-slate-950/45 p-4 shadow-[0_24px_90px_-34px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-6 md:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" aria-hidden />

              {/* Connector arrows (desktop) */}
              <div className="pointer-events-none absolute left-[33.33%] top-14 hidden -translate-x-1/2 text-indigo-200/35 md:block" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="pointer-events-none absolute left-[66.66%] top-14 hidden -translate-x-1/2 text-indigo-200/35 md:block" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>

              <ol className="relative grid gap-4 md:grid-cols-3 md:gap-5">

            {steps.map((s, i) => {
              const cardStyles = [
                "border-indigo-300/30 bg-gradient-to-b from-indigo-500/20 to-slate-950/50 text-indigo-200",
                "border-violet-300/30 bg-gradient-to-b from-violet-500/20 to-slate-950/50 text-violet-200",
                "border-blue-300/30 bg-gradient-to-b from-blue-500/20 to-slate-950/50 text-blue-200",
              ];

              return (
                <LandingReveal key={s.n} delay={i * 0.1}>
                  <li className={`group flex h-full flex-col rounded-[1.5rem] border p-6 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.8)] transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${cardStyles[i]}`}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold shadow-sm ring-1 ring-white/20">
                      {s.n}
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-white sm:text-xl">{s.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-indigo-100/75">{s.text}</p>
                  </li>
                </LandingReveal>
              );
            })}
              </ol>
            </div>
            </LandingReveal>
          </div>
        </div>
      </SectionShell>

      {/* ════ 5. PRODUCTO SHOWCASE ════ */}
      <SectionShell
        id="producto"
        variant="muted"
        className="flex min-h-[100dvh] flex-col justify-center py-8 sm:py-12 md:py-16"
      >
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Producto</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Así se ve tu tienda
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500 sm:text-base dark:text-zinc-400">
              Interfaz limpia para ti y para tus clientes.
            </p>
          </LandingReveal>

          <LandingPhoneCarousel slides={media.phoneCarouselSlides} />
        </div>
      </SectionShell>

      {/* ════ 6. DEMO + CTA INTERMEDIO ════ */}
      <section id="demo" className="relative overflow-hidden bg-slate-900 py-16 sm:py-20 md:py-24 dark:bg-zinc-950">
        <LandingAnimatedGrid />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Empieza ahora
              </p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-[2.75rem] md:leading-[1.15]">
                Crea tu tienda en menos de{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  5 minutos
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Sin código, sin servidores, sin complicaciones. Solo tú y tus productos.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 sm:h-[3.25rem] sm:w-auto sm:text-base"
                >
                  Empezar gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#precios"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-700 px-8 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white sm:h-[3.25rem] sm:w-auto sm:text-base"
                >
                  Ver precios
                </a>
              </div>
            </div>
          </LandingReveal>

          <LandingReveal delay={0.08} direction="right">
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:mt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-950/40 p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" aria-hidden />
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Demo</span>
                </div>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Mira el producto en acción
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
                  Esta demo resume el flujo completo: menú, carrito, pedidos, caja e inventario en una sola presentación.
                </p>
                <div className="mt-6 overflow-hidden">
                  <LandingVideoPlayer
                    src="/Del_caos_al_control.mp4"
                    title="Video demo del producto"
                    subtitle="Versión de demo privada disponible para reuniones comerciales y partners."
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-full rounded-[2rem] border border-slate-700/60 bg-slate-950/40 p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Vista previa</p>
                      <h3 className="mt-1 text-lg font-bold text-white">Por qué conviene usarlo</h3>
                    </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-indigo-300/25">
                      Demo comercial disponible bajo solicitud
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      "Menú, carrito y pago en un solo lugar",
                      "Pedidos y caja con control centralizado",
                      "Inventario por sucursal con alertas",
                      "Presentación lista para reuniones y demos",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* ════ 8. COMPARACIÓN ════ */}
      <SectionShell
        id="comparar"
        variant="white"
        className="relative flex items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_30%)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute left-[-8rem] top-[16%] h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-[-8rem] bottom-[8%] h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>¿Por qué GodCode?</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Compara y decide
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              Elige una opción que te deje crecer sin comisiones altas, sin depender de terceros y con control total de tu negocio.
            </p>
          </LandingReveal>

          <LandingReveal delay={0.1}>
            <div className="mt-10 overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_24px_80px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:mt-14 sm:p-5 dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:shadow-[0_24px_80px_-38px_rgba(0,0,0,0.8)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-zinc-800">
                    <th className="pb-4 pr-4 text-left font-medium text-slate-500 dark:text-zinc-400" />
                    <th className="pb-4 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">IG / WhatsApp</th>
                    <th className="pb-4 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">Rappi / Uber</th>
                    <th className="pb-4 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">Desarrollo propio</th>
                    <th className="pb-4 px-3 text-center font-bold text-indigo-600 dark:text-indigo-300">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
                        GodCode
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.feature} className="border-b border-slate-100/90 transition hover:bg-slate-50/70 dark:border-zinc-800/70 dark:hover:bg-zinc-800/30">
                      <td className="py-4 pr-4 font-medium text-slate-700 dark:text-zinc-300">{row.feature}</td>
                      {([row.ig, row.rappi, row.custom, row.gc] as const).map((val, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "px-3 py-4 text-center",
                            ci === 3 && "bg-gradient-to-b from-indigo-50/85 to-indigo-100/60 font-semibold text-indigo-700 dark:from-indigo-950/40 dark:to-indigo-950/25 dark:text-indigo-200",
                          )}
                        >
                          {typeof val === "boolean"
                            ? val
                              ? <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="Sí" />
                              : <X className="mx-auto h-4 w-4 text-slate-300 dark:text-zinc-600" aria-label="No" />
                            : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              <p className="px-1 pt-3 text-xs text-slate-500 dark:text-zinc-400">
                * Comparativa referencial. Costos y condiciones de terceros pueden variar por país, categoría y promociones vigentes.
              </p>
            </div>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* ════ 9. TESTIMONIOS ════ */}
      <SectionShell
        id="testimonios"
        variant="dark"
        className="relative min-h-0 overflow-hidden border-y border-indigo-500/20 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_50%_58%,rgba(37,99,235,0.2),transparent_38%),linear-gradient(180deg,#0f172a_0%,#070d1d_100%)]"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute left-[-8rem] top-[8%] h-64 w-64 rounded-full bg-indigo-500/22 blur-3xl" />
          <div className="absolute right-[-7rem] top-[20%] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-[62%] h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/14 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow className="!text-indigo-300">Testimonios</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Lo que dicen nuestros clientes
            </h2>
          </LandingReveal>
          <LandingTestimonials />
        </div>
      </SectionShell>

      {/* ════ 10. PRECIOS ════ */}
      <SectionShell id="precios" variant="white" className="min-h-0">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Precios</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Planes simples, sin sorpresas
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500 sm:text-base dark:text-zinc-400">
              Prueba gratis. Sin tarjeta. Cancela cuando quieras.
            </p>
          </LandingReveal>

          {plans.length === 0 ? (
            <LandingReveal delay={0.1}>
              <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-5 py-8 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">Estamos preparando los planes</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Mientras tanto, puedes crear tu cuenta y explorar la plataforma gratis.</p>
                <Link
                  href="/onboarding"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Empezar gratis
                </Link>
              </div>
            </LandingReveal>
          ) : (
            <div
              className={cn(
                "mt-10 grid items-stretch gap-4 sm:gap-6",
                plans.length === 1 && "mx-auto max-w-md",
                plans.length === 2 && "sm:grid-cols-2",
                plans.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {plans.map((plan, index) => {
                const isPopular = index === popularIdx;
                return (
                  <LandingReveal key={plan.id} delay={index * 0.08}>
                    <div
                      className={cn(
                        "relative flex h-full flex-col rounded-2xl border bg-white p-5 transition sm:p-7 dark:bg-zinc-900/60",
                        isPopular
                          ? "z-10 scale-[1.02] border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10 sm:py-9"
                          : "border-slate-200/60 hover:border-slate-300 hover:shadow-lg dark:border-zinc-800 dark:hover:border-zinc-700",
                      )}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow sm:text-xs">
                          Popular
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <div className="mt-4 border-b border-slate-100 pb-4 dark:border-zinc-800">
                        <p className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">{usdMonth.format(plan.price)}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">USD / mes</p>
                      </div>
                      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-zinc-300">
                        {plan.featureBullets.map((b, bi) => (
                          <li key={`${plan.id}-b-${bi}`} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            <span className="whitespace-pre-wrap">{b}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/onboarding"
                        className={cn(
                          "mt-6 inline-flex h-11 items-center justify-center rounded-xl text-center text-sm font-semibold transition",
                          isPopular
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                            : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                        )}
                      >
                        Comenzar
                      </Link>
                    </div>
                  </LandingReveal>
                );
              })}
            </div>
          )}

          <LandingReveal delay={0.2}>
            <p className="mt-8 text-center text-xs text-slate-400 dark:text-zinc-500">
              <Shield className="mr-1 inline h-3 w-3" aria-hidden />
              Garantía: si no te sirve, cancela sin costo ni penalidad.
            </p>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* ════ 11. FAQ ════ */}
      <SectionShell id="faq" variant="muted" className="flex items-center">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Dudas</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Preguntas frecuentes
            </h2>
          </LandingReveal>

          <LandingReveal delay={0.1}>
            <Card className="mt-10 rounded-2xl border-slate-200 bg-white p-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
              <Accordion type="single" collapsible className="border-0 bg-transparent shadow-none">
                {faqItems.map(({ q, a }, idx) => (
                  <AccordionItem key={q} value={String(idx)}>
                    <AccordionTrigger className="group text-left hover:bg-slate-50/80 dark:hover:bg-zinc-800/50">
                      <span className="flex-1 text-sm sm:text-base">{q}</span>
                      <span aria-hidden className="relative h-5 w-5 shrink-0">
                        <Plus className="absolute inset-0 h-5 w-5 text-slate-400 transition-opacity group-data-[state=open]:opacity-0 dark:text-zinc-500" />
                        <Minus className="absolute inset-0 hidden h-5 w-5 text-slate-400 transition-opacity group-data-[state=open]:block dark:text-zinc-500" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm">{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* wave: muted → dark */}
      <div className="relative -mb-px h-8 overflow-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-950 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-0 block h-full w-full">
          <path d="M0 22C240 52 480 54 720 36S1200 0 1440 18V54H0Z" className="fill-current" />
        </svg>
      </div>

      {/* ════ 12. CTA FINAL + CONTACTO ════ */}
      <SectionShell id="contacto" variant="dark" className="relative -mt-px overflow-hidden pb-0">
        <LandingAnimatedGrid />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* Hero CTA */}
          <LandingReveal>
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow className="!text-indigo-400">Último paso</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
                Empieza hoy: tu primera tienda es{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  gratis
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
                Menú digital, pedidos, caja e inventario en un solo lugar. Sin comisiones por venta ni letra chica.
              </p>
              <ul className="mt-6 flex flex-col items-center gap-2 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:text-sm">
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  Sin tarjeta para comenzar
                </li>
                <li className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  Cancelas cuando quieras
                </li>
                <li className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
                  Soporte en menos de 24 h
                </li>
              </ul>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:h-[3.25rem] sm:text-base"
                >
                  Crear mi tienda gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#faq"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-800/40 px-6 text-sm font-medium text-slate-200 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800/70 sm:h-[3.25rem]"
                >
                  Ver preguntas frecuentes
                </a>
              </div>
            </div>
          </LandingReveal>

          {/* Newsletter + contacto (items-start: la tarjeta corta no se estira a la altura de la otra) */}
          <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:mt-20 lg:grid-cols-2 lg:gap-8 lg:items-start">
            <LandingReveal delay={0.08} className="self-start">
              <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/40 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-sm sm:rounded-[1.35rem]">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-90" aria-hidden />
                <div className="flex flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Mail className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Boletín</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
                    ¿Aún no te decides?
                  </h3>
                  <p className="mt-1.5 max-w-md text-pretty text-sm leading-snug text-slate-400">
                    Deja tu correo y te escribimos solo cuando tengamos algo que te sirva. Nada de spam.
                  </p>
                  <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3.5 sm:p-4">
                    <LandingLeadForm dark layout="stacked" />
                  </div>
                </div>
              </div>
            </LandingReveal>

            <LandingReveal delay={0.12} className="self-start">
              <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-950/40 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-sm sm:rounded-[1.35rem]">
                <div
                  className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 opacity-90"
                  aria-hidden
                />
                <div className="flex flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-violet-400">
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Escríbenos</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">¿Tienes dudas?</h3>
                  <p className="mt-1.5 max-w-md text-pretty text-sm leading-snug text-slate-400">
                    Cuéntanos tu rubro y qué necesitas. Respondemos por correo en menos de 24 horas.
                  </p>
                  <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3.5 sm:p-4">
                    <LandingContactForm supportEmail={support} dark className="mt-0 space-y-3" />
                  </div>
                  <div className="mt-4 border-t border-slate-700/40 pt-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href={`mailto:${support}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                      >
                        <Headphones className="h-4 w-4 shrink-0" aria-hidden />
                        {support}
                      </a>
                      <Link
                        href="/onboarding"
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/40 px-4 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800/50 sm:w-auto sm:shrink-0"
                      >
                        Crear mi tienda ya
                      </Link>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/90" aria-hidden />
                        Registro en minutos, sin tarjeta.
                      </li>
                      <li className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/90" aria-hidden />
                        Soporte humano si te atoras.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </LandingReveal>
          </div>

          <div className="pb-10 sm:pb-14" />
        </div>
      </SectionShell>
    </main>
  );
}
