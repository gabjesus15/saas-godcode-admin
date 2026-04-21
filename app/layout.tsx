import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DevServiceWorkerCleanup } from "../components/dev-sw-cleanup";
import { PageAnalyticsTracker } from "../components/analytics/page-analytics-tracker";
import { getMessagesForLocale } from "@/lib/i18n/messages";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getAppUrl } from "@/lib/app-url";
// import Image from 'next/image'; // Eliminado porque no se usa

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});


// Mejorar título y descripción según idioma
// import { SUPPORTED_LOCALES } from "@/lib/i18n/config"; // Eliminado porque no se usa
const DESCRIPTIONS: Record<string, string> = {
  es: "Panel de administración multi-tenant: empresas, planes, onboarding y soporte.",
  en: "Multi-tenant admin panel: companies, plans, onboarding and support.",
  pt: "Painel de administração multi-tenant: empresas, planos, onboarding e suporte.",
  fr: "Panneau d'administration multi-tenant : entreprises, plans, onboarding et support.",
  de: "Multi-Tenant-Admin-Panel: Unternehmen, Pläne, Onboarding und Support.",
  it: "Pannello di amministrazione multi-tenant: aziende, piani, onboarding e supporto.",
};

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "GodCode",
    template: "%s · GodCode",
  },
  description: DESCRIPTIONS[typeof window !== "undefined" ? (window.navigator.language?.split("-")[0] || "es") : "es"],
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
      undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const messages = getMessagesForLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://saas-godcode-admin.vercel.app" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")} crossOrigin="anonymous" />
        ) : null}
        <link rel="preload" href="/fonts/outfit.css" as="style" />
        <link rel="preload" href="/fonts/Outfit-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Outfit-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/custom-fonts.css" />
        {/* Etiqueta canónica y hreflang para SEO internacional */}
        <link
          rel="canonical"
          href={`${getAppUrl()}`}
        />
        {/* Etiquetas hreflang para todos los idiomas soportados */}
        {['es','en','pt','fr','de','it'].map((lang) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${getAppUrl()}?hl=${lang}`}
          />
        ))}
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased transition-colors duration-200`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Logo y slogan eliminados del layout global por petición del usuario */}
          {process.env.NODE_ENV !== "production" ? <DevServiceWorkerCleanup /> : null}
          {process.env.NODE_ENV === "production" ? <PageAnalyticsTracker /> : null}
          {children}
          {process.env.NODE_ENV === "production" ? (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          ) : null}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
