import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  ImageIcon,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Receipt,
  Shield,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import { popularPlanIndex, type PublicPlanForLanding } from "../../lib/public-plans";
import { cn } from "../../utils/cn";
import { Card } from "../ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { LandingProductCarousel, type LandingProductSlide } from "./landing-product-carousel";
import { MenuScreenMock, CartScreenMock, OperationsScreenMock } from "./landing-product-screen-mocks";
import { LandingContactForm } from "./landing-contact-form";
import { LandingHeroIllustrationAnimated } from "./landing-hero-illustration-animated";
import { LandingLeadForm } from "./landing-lead-form";
import { LandingReveal } from "./landing-reveal";

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
  variant?: "default" | "white" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  const bg =
    variant === "white"
      ? "bg-white dark:bg-zinc-950"
      : variant === "muted"
        ? "bg-slate-50 dark:bg-zinc-950"
        : "bg-transparent";
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 border-b border-slate-200/40 py-14 sm:py-20 md:py-24 dark:border-zinc-800/50", bg, className)}
    >
      {children}
    </section>
  );
}

/* ───── Data ───── */

const features = [
  {
    icon: Store,
    title: "Menú digital",
    text: "Categorías, fotos, precios por sucursal. Tu cliente ve todo desde su celular.",
  },
  {
    icon: ShoppingCart,
    title: "Carrito y checkout",
    text: "Pedidos claros con totales, método de entrega y pago integrado.",
  },
  {
    icon: Truck,
    title: "Delivery y retiro",
    text: "Configura zonas de reparto, cotiza envíos y ofrece retiro en local.",
  },
  {
    icon: LayoutDashboard,
    title: "Sistema de caja",
    text: "Punto de venta para cobrar en tu local. Rápido y simple.",
  },
  {
    icon: UtensilsCrossed,
    title: "Comandas de cocina",
    text: "Los pedidos llegan directo a cocina. Sin papelitos perdidos.",
  },
  {
    icon: Package,
    title: "Inventario",
    text: "Controla stock por producto y sucursal. Alertas cuando se acaba.",
  },
  {
    icon: Receipt,
    title: "Facturación",
    text: "Genera comprobantes para tus clientes automáticamente.",
  },
  {
    icon: ImageIcon,
    title: "Tu marca, tu diseño",
    text: "Logo, colores y un carrusel de banners personalizados en tu tienda.",
  },
] as const;

const steps = [
  { n: "1", title: "Regístrate", text: "Crea tu cuenta con email. Sin tarjeta de crédito." },
  { n: "2", title: "Arma tu tienda", text: "Sube productos, configura delivery y sucursales." },
  { n: "3", title: "Empieza a vender", text: "Comparte tu link y recibe pedidos desde el día 1." },
] as const;

const diffPoints = [
  {
    vs: "Instagram / WhatsApp",
    problem: "Tus pedidos se pierden en los DMs.",
    solution: "Con GodCode cada pedido queda registrado con total, estado y datos del cliente.",
  },
  {
    vs: "Rappi / UberEats",
    problem: "Se quedan con el 25-30% de cada venta y con los datos de tus clientes.",
    solution: "Con GodCode pagas una tarifa fija y los clientes son tuyos.",
  },
  {
    vs: "Desarrollo propio",
    problem: "Meses de desarrollo, servidor y mantenimiento constante.",
    solution: "Con GodCode abres tu tienda hoy sin programar una línea.",
  },
] as const;

const useCases = [
  { icon: UtensilsCrossed, title: "Restaurantes y cafeterías", text: "Menú digital con categorías, combos y pedidos para delivery o retiro por sucursal." },
  { icon: Package, title: "Tiendas y minimarkets", text: "Catálogo de productos, carrito con totales automáticos y despacho por tienda." },
  { icon: Truck, title: "Negocios con delivery", text: "Gestión de zonas, cotización de envíos y seguimiento de pedidos en tiempo real." },
] as const;

const faqItems = [
  { q: "¿No sé nada de tecnología, puedo usarlo?", a: "Sí. No necesitas programar ni saber de servidores. Te registras, subes tus productos y tu tienda está lista. Si tienes dudas, nuestro soporte te guía." },
  { q: "¿Cuánto cuesta realmente?", a: "Los precios están en la sección de planes arriba. No hay costos ocultos, comisiones por venta ni cargos sorpresa." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Sin penalidad, sin permanencia mínima. Si no te sirve, cancelas y listo." },
  { q: "¿Mis datos están seguros?", a: "Usamos encriptación SSL, servidores protegidos y cada negocio tiene sus datos completamente aislados. Nadie más puede ver tu información." },
  { q: "¿Cuánto tardo en tener mi tienda lista?", a: "Si ya tienes tus productos y fotos, menos de 1 hora. El proceso de registro toma 5 minutos." },
  { q: "¿Puedo tener varias sucursales?", a: "Sí. Cada sucursal tiene su propio inventario, precios, zona de delivery y horarios." },
] as const;

/* ───── Main component ───── */

export function LandingSections({ plans }: { plans: PublicPlanForLanding[] }) {
  const support = getSupportEmail();
  const popularIdx = popularPlanIndex(plans.length);

  return (
    <main className="relative z-10">

      {/* ════ 1. HERO ════ */}
      <section id="inicio" className="scroll-mt-20 border-b border-slate-200/40 pb-14 pt-10 sm:pb-20 md:pt-14 lg:pb-24 dark:border-zinc-800/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-5 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <LandingReveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 sm:px-4 sm:text-xs dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                <Clock className="h-3 w-3" aria-hidden />
                Precio de lanzamiento — Primeros negocios con descuento
              </span>
            </LandingReveal>

            <LandingReveal delay={0.08}>
              <h1 className="mt-5 text-[1.7rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3.25rem] dark:text-white">
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
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 sm:h-[3.25rem] sm:w-auto sm:px-8 sm:text-base dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
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

          <div className="order-1 w-full max-w-sm sm:max-w-md lg:order-2 lg:max-w-none">
            <LandingReveal delay={0.1} direction="right">
              <LandingHeroIllustrationAnimated />
            </LandingReveal>
          </div>
        </div>
      </section>

      {/* ════ 2. TRUST STRIP ════ */}
      <SectionShell variant="white" className="border-t-0 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <LandingReveal>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-500 sm:gap-x-12 dark:text-zinc-400">
              <span className="inline-flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />Pagos con Stripe / PayPal</span>
              <span className="inline-flex items-center gap-2 font-medium"><Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />Cifrado SSL</span>
              <span className="inline-flex items-center gap-2 font-medium"><Headphones className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />Soporte por email</span>
            </div>
          </LandingReveal>
          <LandingReveal delay={0.1}>
            <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-zinc-400">
              Plataforma en lanzamiento — <span className="text-indigo-600 dark:text-indigo-400">sé el primero en tu ciudad</span>
            </p>
          </LandingReveal>
        </div>
      </SectionShell>

      {/* ════ 3. CÓMO FUNCIONA ════ */}
      <SectionShell id="como-funciona" variant="muted">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>3 pasos</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Tu tienda lista en minutos
            </h2>
          </LandingReveal>

          <div className="relative mt-10 sm:mt-14">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent md:block dark:via-indigo-900/50" />
            <ol className="relative grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <LandingReveal key={s.n} delay={i * 0.1}>
                  <li className="text-center">
                    <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-md sm:h-14 sm:w-14 dark:bg-white dark:text-slate-900">
                      {s.n}
                    </span>
                    <h3 className="mt-4 text-sm font-bold text-slate-900 sm:text-base dark:text-white">{s.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-zinc-400">{s.text}</p>
                  </li>
                </LandingReveal>
              ))}
            </ol>
          </div>
        </div>
      </SectionShell>

      {/* ════ 4. FEATURES ════ */}
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

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {features.map(({ icon: Icon, title, text }, i) => (
              <LandingReveal key={title} delay={i * 0.05}>
                <div className="group rounded-2xl border border-slate-200/60 bg-white p-5 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/30">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 sm:h-11 sm:w-11 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-zinc-400">{text}</p>
                </div>
              </LandingReveal>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ════ 5. PRODUCTO ════ */}
      <SectionShell id="producto" variant="muted">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>Producto</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Así se ve tu tienda
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500 sm:text-base dark:text-zinc-400">
              Interfaz limpia para ti y para tus clientes.
            </p>
          </LandingReveal>

          <LandingProductCarousel
            slides={[
              { title: "Menú digital", sub: "Categorías, productos y banners personalizados por negocio.", content: <MenuScreenMock /> },
              { title: "Carrito y checkout", sub: "Resumen de pedido, método de entrega y pago integrado.", content: <CartScreenMock /> },
              { title: "Panel de operación", sub: "Pedidos en tiempo real, métricas y gestión de sucursales.", content: <OperationsScreenMock /> },
            ] satisfies LandingProductSlide[]}
          />
        </div>
      </SectionShell>

      {/* ════ 6. DIFERENCIACIÓN ════ */}
      <SectionShell id="comparar" variant="white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>¿Por qué GodCode?</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Compara y decide
            </h2>
          </LandingReveal>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-3">
            {diffPoints.map((d, i) => (
              <LandingReveal key={d.vs} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">vs. {d.vs}</p>
                  <p className="mt-3 text-sm font-medium leading-snug text-slate-700 dark:text-zinc-300">
                    <span className="text-red-500 dark:text-red-400">✕</span> {d.problem}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-snug text-slate-600 dark:text-zinc-400">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span> {d.solution}
                  </p>
                </div>
              </LandingReveal>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ════ 7. PARA QUIÉN ════ */}
      <SectionShell id="casos" variant="muted">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <LandingReveal>
            <Eyebrow>¿Para quién es?</Eyebrow>
            <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Pensado para negocios como el tuyo
            </h2>
          </LandingReveal>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {useCases.map(({ icon: Icon, title, text }, i) => (
              <LandingReveal key={title} delay={i * 0.08}>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <Icon className="mb-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-zinc-400">{text}</p>
                </div>
              </LandingReveal>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ════ 8. PRECIOS ════ */}
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
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
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
                        "relative flex h-full flex-col rounded-2xl border bg-white p-5 sm:p-7 dark:bg-zinc-900/60",
                        isPopular
                          ? "z-10 border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/10 sm:py-9"
                          : "border-slate-200/60 dark:border-zinc-800",
                      )}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow sm:text-xs dark:bg-white dark:text-slate-900">
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
                            ? "bg-slate-900 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
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

      {/* ════ 9. FAQ ════ */}
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

      {/* ════ 10. LEAD CAPTURE + CONTACTO ════ */}
      <SectionShell id="contacto" variant="white" className="border-b-0 pb-14 sm:pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          {/* Lead capture */}
          <LandingReveal>
            <div className="mx-auto mb-12 max-w-xl rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 text-center sm:mb-16 sm:p-8 dark:border-indigo-500/20 dark:bg-indigo-950/20">
              <Smartphone className="mx-auto h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-slate-800 sm:text-base dark:text-zinc-200">¿Todavía no estás listo?</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">Déjanos tu correo y te avisamos de novedades y ofertas.</p>
              <LandingLeadForm />
            </div>
          </LandingReveal>

          {/* Contact */}
          <LandingReveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="grid md:grid-cols-2">
                <div className="p-5 sm:p-8 md:p-10">
                  <Eyebrow className="!text-left">Contacto</Eyebrow>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">¿Tienes dudas?</h2>
                  <p className="mt-2 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">
                    Escríbenos y te respondemos en menos de 24 horas.
                  </p>
                  <LandingContactForm supportEmail={support} />
                  <div className="mt-5 flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                    <a href={`mailto:${support}`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">{support}</a>
                  </div>
                </div>
                <div className="flex flex-col justify-center border-t border-slate-100 bg-slate-50 p-5 sm:p-8 md:border-l md:border-t-0 md:p-10 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">También puedes empezar directamente</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-zinc-400">
                    El registro toma 5 minutos. Si tienes dudas después, nuestro soporte te ayuda.
                  </p>
                  <Link
                    href="/onboarding"
                    className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                  >
                    Crear mi tienda
                  </Link>
                </div>
              </div>
            </div>
          </LandingReveal>
        </div>
      </SectionShell>
    </main>
  );
}
