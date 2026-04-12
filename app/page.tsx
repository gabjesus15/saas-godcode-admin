import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";

import { GodcodeLanding } from "../components/landing/godcode-landing";
import { getAppUrl } from "../lib/app-url";
import { getMessagesForLocale } from "@/lib/i18n/messages";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getLandingMediaBundle } from "../lib/landing-media";
import { getPublicPlansForLanding } from "../lib/public-plans";
import { getSubdomainFromHost, isMainDomain } from "../lib/main-domain-host";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const locale = await getCurrentLocale();
  const messages = getMessagesForLocale(locale);
  const host = hdrs.get("host") || "";
  if (!isMainDomain(host)) {
    return {};
  }
  const base = getAppUrl();
  const shareTitle = messages.landing.meta.title;
  const description = messages.landing.meta.description;

  return {
    title: { absolute: "GodCode" },
    description,
    keywords: [
      "tienda online",
      "menú digital",
      "sistema de pedidos",
      "delivery",
      "punto de venta",
      "inventario",
      "facturación",
      "SaaS restaurantes",
      "plataforma ecommerce",
      "GodCode",
    ],
    alternates: { canonical: `${base}/` },
    openGraph: {
      title: shareTitle,
      description,
      url: base,
      siteName: "GodCode",
      locale: "es_CL",
      type: "website",
      images: [
        {
          url: `${base}/api/og`,
          width: 1200,
          height: 630,
          alt: shareTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [`${base}/api/og`],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

function JsonLd({ plans }: { plans: { price?: number | null }[] }) {
  const base = getAppUrl();
  const prices = plans
    .map((p) => Number(p.price ?? 0))
    .filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;

  const offers =
    minPrice !== undefined
      ? {
          "@type": "AggregateOffer",
          lowPrice: String(minPrice),
          highPrice: String(maxPrice),
          priceCurrency: "USD",
          offerCount: String(prices.length),
        }
      : {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Consulta planes disponibles",
        };

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "GodCode",
      url: base,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Plataforma SaaS para crear tu tienda online con menú digital, carrito, delivery, caja, comandas e inventario.",
      offers,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "GodCode",
      url: base,
      contactPoint: {
        "@type": "ContactPoint",
        email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hola@godcode.me",
        contactType: "customer support",
        availableLanguage: ["es", "en", "pt", "fr", "de", "it"],
      },
    },
  ];
  return (
    <Script
      id="godcode-jsonld-landing"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export default async function Home() {
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  if (isMainDomain(host)) {
    const [plans, media] = await Promise.all([
      getPublicPlansForLanding(),
      getLandingMediaBundle(),
    ]);
    return (
      <>
        <JsonLd plans={plans} />
        <GodcodeLanding plans={plans} media={media} />
      </>
    );
  }
  const subdomain = getSubdomainFromHost(host);
  if (subdomain) {
    redirect(`/${subdomain}`);
  }
  redirect("/login");
}
