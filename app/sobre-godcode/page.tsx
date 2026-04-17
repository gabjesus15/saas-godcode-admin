import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, BadgeInfo, Building2, ChartNoAxesCombined, ShieldCheck, Sparkles, Users } from "lucide-react";

import { LandingLogo } from "@/components/landing/landing-logo";
import { getAppUrl } from "@/lib/app-url";
import { getCurrentLocale } from "@/lib/i18n/server";

const copy = {
  es: {
    eyebrow: "Sobre GodCode",
    title: "Una marca pensada para vender online sin perder el control de tu negocio.",
    intro:
      "GodCode nace para simplificar lo que hoy suele estar fragmentado: menú digital, pedidos online, caja, inventario y delivery en una sola plataforma limpia y fácil de usar.",
    primaryCta: "Crear mi tienda",
    secondaryCta: "Ver la home",
    sectionOneTitle: "Qué resuelve",
    sectionOneText:
      "Ayuda a restaurantes y negocios con sucursales a vender por su propia web, con menos fricción y sin depender de marketplaces que cobran comisión por cada pedido.",
    sectionTwoTitle: "Cómo trabajamos",
    sectionTwoText:
      "Priorizamos una experiencia simple para el negocio y clara para el cliente final: menos pasos, menos pantallas y una ruta directa desde el menú hasta el pago.",
    sectionThreeTitle: "Por qué importa",
    sectionThreeText:
      "Cuando tu marca vive en tu propio dominio, también construyes autoridad, posicionamiento y una relación más directa con tus clientes.",
    metrics: [
      { label: "Menú digital", value: "1" },
      { label: "Carrito y checkout", value: "1" },
      { label: "Caja e inventario", value: "1" },
      { label: "Marca propia", value: "100%" },
    ],
    valuesTitle: "Principios de la plataforma",
    values: [
      { icon: ShieldCheck, title: "Datos protegidos", text: "Cada negocio mantiene su información aislada y segura." },
      { icon: Sparkles, title: "Experiencia limpia", text: "Interfaces directas, sin ruido visual ni pasos innecesarios." },
      { icon: Users, title: "Pensado para equipos reales", text: "Funciona para locales únicos y para operaciones con varias sucursales." },
      { icon: ChartNoAxesCombined, title: "Crecimiento visible", text: "Una marca fuerte y un dominio propio ayudan a posicionarte mejor." },
    ],
    closingTitle: "Hecho para que GodCode sea fácil de recordar y fácil de encontrar.",
    closingText:
      "Mientras Google termina de procesar tu sitio, esta página te ayuda a reforzar la identidad de marca y a tener una URL clara para compartir en perfiles, emails y menciones.",
  },
  en: {
    eyebrow: "About GodCode",
    title: "A brand designed to sell online without losing control of your business.",
    intro:
      "GodCode was built to simplify what is usually fragmented: digital menu, online orders, POS, inventory and delivery in one clean, easy-to-use platform.",
    primaryCta: "Create my store",
    secondaryCta: "View home",
    sectionOneTitle: "What it solves",
    sectionOneText:
      "It helps restaurants and multi-branch businesses sell through their own website, with less friction and without depending on marketplaces that charge commission on every order.",
    sectionTwoTitle: "How we work",
    sectionTwoText:
      "We focus on a simple experience for the business and a clear one for the customer: fewer steps, fewer screens and a direct path from menu to payment.",
    sectionThreeTitle: "Why it matters",
    sectionThreeText:
      "When your brand lives on your own domain, you also build authority, visibility and a more direct relationship with your customers.",
    metrics: [
      { label: "Digital menu", value: "1" },
      { label: "Cart and checkout", value: "1" },
      { label: "POS and inventory", value: "1" },
      { label: "Own brand", value: "100%" },
    ],
    valuesTitle: "Platform principles",
    values: [
      { icon: ShieldCheck, title: "Protected data", text: "Each business keeps its information isolated and secure." },
      { icon: Sparkles, title: "Clean experience", text: "Straightforward interfaces without visual noise or extra steps." },
      { icon: Users, title: "Built for real teams", text: "Works for single locations and multi-branch operations alike." },
      { icon: ChartNoAxesCombined, title: "Visible growth", text: "A strong brand and your own domain help you rank better." },
    ],
    closingTitle: "Made to make GodCode easy to remember and easy to find.",
    closingText:
      "While Google finishes processing your site, this page helps reinforce your brand identity and gives you a clear URL to share on profiles, emails and mentions.",
  },
} as const;

function getLocaleCopy(locale: string) {
  return locale.toLowerCase().startsWith("es") ? copy.es : copy.en;
}

export async function generateMetadata(): Promise<Metadata> {
  const base = getAppUrl();
  return {
    metadataBase: new URL(base),
    title: "Sobre GodCode",
    description:
      "Página de marca de GodCode: una plataforma para menú digital, pedidos online, caja, inventario y delivery.",
    alternates: {
      canonical: `${base}/sobre-godcode`,
    },
    openGraph: {
      title: "Sobre GodCode",
      description:
        "Una página de marca para reforzar la identidad de GodCode y su propuesta de valor.",
      url: `${base}/sobre-godcode`,
      siteName: "GodCode",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export default async function SobreGodCodePage() {
  const locale = await getCurrentLocale();
  const t = getLocaleCopy(locale);
  const base = getAppUrl();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Sobre GodCode",
      url: `${base}/sobre-godcode`,
      description: t.intro,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "GodCode",
      url: base,
    },
  ];

  return (
    <main className="relative overflow-hidden bg-white text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      <Script
        id="godcode-about-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_28%),linear-gradient(to_bottom,rgba(248,250,252,1),rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),linear-gradient(to_bottom,rgba(9,9,11,1),rgba(9,9,11,1))]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            <LandingLogo className="gap-1" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 sm:inline-flex"
            >
              ← Volver al inicio
            </Link>
            <Link
              href="/onboarding"
              className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 sm:inline-flex"
            >
              {t.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-300">
              <BadgeInfo className="h-3.5 w-3.5" aria-hidden />
              {t.eyebrow}
            </span>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              {t.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-zinc-300">
              {t.intro}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
              >
                {t.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {t.metrics.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-indigo-200/70 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-[0_24px_80px_rgba(79,70,229,0.28)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">GodCode</p>
              <p className="mt-4 text-xl font-semibold leading-tight sm:text-2xl">
                Plataforma SaaS para menú digital, pedidos online, caja, inventario y delivery.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-indigo-100/90">
                Diseñada para que tu marca viva en tu propio dominio y puedas compartir una URL simple, clara y recordable.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/80">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{t.sectionOneTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{t.sectionOneText}</p>
          </article>
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/80">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{t.sectionTwoTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{t.sectionTwoText}</p>
          </article>
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/80">
            <ChartNoAxesCombined className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{t.sectionThreeTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{t.sectionThreeText}</p>
          </article>
        </div>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t.valuesTitle}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.values.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
                  <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-indigo-200/70 bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-[0_24px_80px_rgba(79,70,229,0.28)] sm:p-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.closingTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-100 sm:text-base">{t.closingText}</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">
              {t.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              {t.secondaryCta}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
