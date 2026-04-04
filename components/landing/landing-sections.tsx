import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Globe,
  Headphones,
  Minus,
  Plus,
  Shield,
  Smartphone,
  Users,
  X,
} from "lucide-react";

import { popularPlanIndex, type PublicPlanForLanding } from "../../lib/public-plans";
import { cn } from "../../utils/cn";
import { Card } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { LandingReveal } from "./landing-reveal";
import { LandingFeatureBlock } from "./landing-feature-block";
import { LandingTestimonials } from "./landing-testimonials";
import { LandingCountUp } from "./landing-count-up";
import { LaptopFrame, PhoneFrame } from "./landing-device-frame";
import { ScreenPlaceholder } from "./landing-screen-placeholder";
import { LandingAnimatedGrid } from "./landing-animated-grid";
import { LandingPhoneCarousel } from "./landing-phone-carousel";
import { LandingContactForm } from "./landing-contact-form";
import { LandingLeadForm } from "./landing-lead-form";

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
      className={cn("scroll-mt-20 py-14 sm:py-20 md:py-24", bg, className)}
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
  { feature: "Comisión por venta", ig: "0%", rappi: "25-30%", custom: "0%", gc: "0%" },
  { feature: "Control de clientes", ig: false, rappi: false, custom: true, gc: true },
  { feature: "Tu propia marca", ig: false, rappi: false, custom: true, gc: true },
  { feature: "Tiempo de setup", ig: "1 día", rappi: "1-2 sem.", custom: "2-6 meses", gc: "5 min" },
  { feature: "Costo mensual", ig: "Gratis*", rappi: "Gratis*", custom: "$500+", gc: "Desde $9" },
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

export function LandingSections({ plans }: { plans: PublicPlanForLanding[] }) {
  const support = getSupportEmail();
  const popularIdx = popularPlanIndex(plans.length);

  return (
    <main className="relative z-10">

      {/* ════ 1. HERO ════ */}
      <section
        id="inicio"
        className="relative scroll-mt-20 overflow-hidden pb-14 pt-10 sm:pb-20 md:pt-14 lg:pb-28"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(226 232 240 / 0.4) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-zinc-950 dark:via-indigo-950/10 dark:to-zinc-950" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-5 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <LandingReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-medium text-indigo-700 backdrop-blur sm:px-4 sm:text-xs dark:border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                </span>
                Lanzamiento — Descuento para primeros negocios
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
              <div className="relative mx-auto max-w-lg pb-8 sm:pb-10 lg:max-w-none">
                <LaptopFrame>
                  <ScreenPlaceholder variant="dashboard" />
                </LaptopFrame>
                <div className="absolute -bottom-2 -left-2 z-10 sm:-bottom-4 sm:-left-6 lg:-left-10">
                  <PhoneFrame className="!max-w-[90px] sm:!max-w-[130px] lg:!max-w-[150px]">
                    <ScreenPlaceholder variant="menu-mobile" />
                  </PhoneFrame>
                </div>
              </div>
            </LandingReveal>
          </div>
        </div>
      </section>

      {/* wave: white → dark */}
      <div className="relative -mb-px h-8 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M0 22C240 52 480 54 720 36S1200 0 1440 18V54H0Z" className="fill-slate-900 dark:fill-zinc-950" />
        </svg>
      </div>

      {/* ════ 2. TRUST STRIP + KPIs ════ */}
      <SectionShell variant="dark" className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <LandingReveal>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-400 sm:gap-x-12">
              <span className="inline-flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-indigo-400" aria-hidden />Stripe / PayPal</span>
              <span className="inline-flex items-center gap-2 font-medium"><Shield className="h-4 w-4 text-indigo-400" aria-hidden />Cifrado SSL</span>
              <span className="inline-flex items-center gap-2 font-medium"><Headphones className="h-4 w-4 text-indigo-400" aria-hidden />Soporte por email</span>
            </div>
          </LandingReveal>

          <LandingReveal delay={0.1}>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 md:grid-cols-4">
              {([
                { end: 100, suffix: "+", label: "Negocios activos" },
                { end: 10000, suffix: "+", label: "Pedidos procesados" },
                { end: 5, suffix: "", label: "Países" },
                { end: 99.9, suffix: "%", label: "Uptime" },
              ] as const).map((kpi, i) => (
                <div key={kpi.label} className="text-center">
                  <p className="text-2xl font-bold text-white sm:text-3xl">
                    <LandingCountUp end={kpi.end} suffix={kpi.suffix} duration={1800 + i * 200} />
                  </p>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">{kpi.label}</p>
                </div>
              ))}
            </div>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* wave: dark → white */}
      <div className="relative -mb-px h-8 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M0 32C360 4 720 0 1080 22S1380 52 1440 40V0H0Z" className="fill-slate-900 dark:fill-zinc-950" />
        </svg>
      </div>

      {/* ════ 3. FEATURE SPOTLIGHTS ════ */}
      <SectionShell id="funciones" variant="white">
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
              "Pagos con tarjeta, transferencia o efectivo",
              "Banners promocionales personalizados",
            ]}
            visual={<ScreenPlaceholder variant="menu" />}
          />

          <LandingFeatureBlock
            eyebrow="Operaciones"
            title="Punto de venta y caja registradora"
            description="Cobra en tu local con un sistema rápido y simple. Turnos de caja, métodos de pago y resumen de ventas en un solo lugar."
            bullets={[
              "POS táctil rápido e intuitivo",
              "Turnos de caja con apertura y cierre",
              "Múltiples métodos de pago",
              "Reportes de venta en tiempo real",
            ]}
            visual={<ScreenPlaceholder variant="pos" />}
            reversed
            delay={0.05}
          />

          <LandingFeatureBlock
            eyebrow="Control"
            title="Inventario y gestión por sucursal"
            description="Controla el stock de cada producto por sucursal. Recibe alertas cuando se está acabando y lleva el historial de movimientos."
            bullets={[
              "Stock en tiempo real por sucursal",
              "Alertas de inventario bajo",
              "Recetas: descuento automático al vender",
              "Historial completo de movimientos",
            ]}
            visual={<ScreenPlaceholder variant="inventory" />}
            delay={0.1}
          />
        </div>
      </SectionShell>

      {/* ════ 4. CÓMO FUNCIONA ════ */}
      <SectionShell id="como-funciona" variant="muted">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Tu tienda lista en minutos
            </h2>
          </LandingReveal>

          <ol className="relative mt-12 grid gap-6 sm:mt-16 md:grid-cols-3">
            {/* Connector arrows (desktop) */}
            <div className="pointer-events-none absolute left-[33.33%] top-10 hidden -translate-x-1/2 text-slate-300 md:block dark:text-zinc-700" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="pointer-events-none absolute left-[66.66%] top-10 hidden -translate-x-1/2 text-slate-300 md:block dark:text-zinc-700" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

            {steps.map((s, i) => {
              const colors = [
                "border-t-indigo-500 bg-indigo-50/50 text-indigo-600 dark:border-t-indigo-400 dark:bg-indigo-950/20 dark:text-indigo-400",
                "border-t-violet-500 bg-violet-50/50 text-violet-600 dark:border-t-violet-400 dark:bg-violet-950/20 dark:text-violet-400",
                "border-t-emerald-500 bg-emerald-50/50 text-emerald-600 dark:border-t-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-400",
              ];
              const [borderColor, numBg, numColor] = colors[i].split(" ").reduce<[string, string, string]>(
                (acc, cls) => {
                  if (cls.startsWith("border-t-")) acc[0] += ` ${cls}`;
                  else if (cls.startsWith("bg-") || cls.startsWith("dark:bg-")) acc[1] += ` ${cls}`;
                  else acc[2] += ` ${cls}`;
                  return acc;
                },
                ["", "", ""],
              );

              return (
                <LandingReveal key={s.n} delay={i * 0.1}>
                  <li className={`flex h-full flex-col rounded-2xl border border-slate-200/60 border-t-[3px] bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60 ${borderColor}`}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${numBg} ${numColor}`}>
                      {s.n}
                    </span>
                    <h3 className="mt-5 text-base font-bold text-slate-900 sm:text-lg dark:text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{s.text}</p>
                  </li>
                </LandingReveal>
              );
            })}
          </ol>
        </div>
      </SectionShell>

      {/* ════ 5. PRODUCTO SHOWCASE ════ */}
      <SectionShell id="producto" variant="muted">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Producto</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Así se ve tu tienda
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500 sm:text-base dark:text-zinc-400">
              Interfaz limpia para ti y para tus clientes.
            </p>
          </LandingReveal>

          <LandingPhoneCarousel />
        </div>
      </SectionShell>

      {/* ════ 6. CTA INTERMEDIO ════ */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20 md:py-24 dark:bg-zinc-950">
        <LandingAnimatedGrid />

        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <LandingReveal>
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
          </LandingReveal>
        </div>
      </section>

      {/* ════ 7. COMPARACIÓN ════ */}
      <SectionShell id="comparar" variant="white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>¿Por qué GodCode?</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Compara y decide
            </h2>
          </LandingReveal>

          <LandingReveal delay={0.1}>
            <div className="mt-10 overflow-x-auto sm:mt-14">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800">
                    <th className="pb-3 pr-4 text-left font-medium text-slate-500 dark:text-zinc-400" />
                    <th className="pb-3 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">IG / WhatsApp</th>
                    <th className="pb-3 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">Rappi / Uber</th>
                    <th className="pb-3 px-3 text-center font-medium text-slate-500 dark:text-zinc-400">Desarrollo propio</th>
                    <th className="pb-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">GodCode</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.feature} className="border-b border-slate-100 dark:border-zinc-800/60">
                      <td className="py-3 pr-4 font-medium text-slate-700 dark:text-zinc-300">{row.feature}</td>
                      {([row.ig, row.rappi, row.custom, row.gc] as const).map((val, ci) => (
                        <td key={ci} className={cn("px-3 py-3 text-center", ci === 3 && "bg-indigo-50/50 font-semibold text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300")}>
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
          </LandingReveal>
        </div>
      </SectionShell>

      {/* ════ 8. TESTIMONIOS ════ */}
      <SectionShell id="testimonios" variant="muted">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Testimonios</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Lo que dicen nuestros clientes
            </h2>
          </LandingReveal>
          <LandingTestimonials />
        </div>
      </SectionShell>

      {/* ════ 9. PRECIOS ════ */}
      <SectionShell id="precios" variant="white">
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
                        <p className="text-xs text-slate-500 dark:text-zinc-500">/ mes</p>
                      </div>
                      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-zinc-300">
                        {plan.featureBullets.map((b) => (
                          <li key={`${plan.id}-${b}`} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            <span>{b}</span>
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

      {/* ════ 10. FAQ ════ */}
      <SectionShell id="faq" variant="muted">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
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
      <div className="relative -mb-px h-8 sm:h-12">
        <svg viewBox="0 0 1440 54" fill="none" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M0 22C240 52 480 54 720 36S1200 0 1440 18V54H0Z" className="fill-slate-900 dark:fill-zinc-950" />
        </svg>
      </div>

      {/* ════ 11. CTA FINAL + CONTACTO ════ */}
      <SectionShell id="contacto" variant="dark" className="pb-0">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          {/* CTA */}
          <LandingReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Empieza hoy — tu primera tienda es gratis
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Únete a los negocios que ya venden con GodCode. Sin riesgos, sin contratos.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 sm:w-auto sm:text-base"
                >
                  Crear mi tienda gratis
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </LandingReveal>

          {/* Lead capture */}
          <LandingReveal delay={0.1}>
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 text-center backdrop-blur sm:mt-16 sm:p-8">
              <Smartphone className="mx-auto h-6 w-6 text-indigo-400" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-white sm:text-base">¿Todavía no estás listo?</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">Déjanos tu correo y te avisamos de novedades.</p>
              <LandingLeadForm dark />
            </div>
          </LandingReveal>

          {/* Contact */}
          <LandingReveal delay={0.15}>
            <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur sm:mt-16">
              <div className="grid md:grid-cols-2">
                <div className="p-5 sm:p-8 md:p-10">
                  <Eyebrow className="!text-left !text-indigo-400">Contacto</Eyebrow>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">¿Tienes dudas?</h2>
                  <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                    Escríbenos y te respondemos en menos de 24 horas.
                  </p>
                  <LandingContactForm supportEmail={support} dark />
                  <div className="mt-5 flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-indigo-400" aria-hidden />
                    <a href={`mailto:${support}`} className="text-sm font-medium text-indigo-400 hover:underline">{support}</a>
                  </div>
                </div>
                <div className="flex flex-col justify-center border-t border-slate-700/40 bg-slate-800/60 p-5 sm:p-8 md:border-l md:border-t-0 md:p-10">
                  <Users className="h-8 w-8 text-indigo-400" aria-hidden />
                  <p className="mt-4 text-sm font-semibold text-white">También puedes empezar directamente</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
                    El registro toma 5 minutos. Si tienes dudas después, nuestro soporte te ayuda.
                  </p>
                  <Link
                    href="/onboarding"
                    className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    Crear mi tienda
                  </Link>
                </div>
              </div>
            </div>
          </LandingReveal>

          <div className="pb-10 sm:pb-14" />
        </div>
      </SectionShell>
    </main>
  );
}
