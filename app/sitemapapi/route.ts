import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getAppUrl } from "../../lib/app-url";

const DEFAULT_SITEMAP_LAST_MODIFIED = "2026-04-17T00:00:00.000Z";

function getSitemapLastModified(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITEMAP_LAST_MODIFIED?.trim();
  const date = fromEnv ? new Date(fromEnv) : new Date(DEFAULT_SITEMAP_LAST_MODIFIED);
  return Number.isNaN(date.getTime()) ? DEFAULT_SITEMAP_LAST_MODIFIED : date.toISOString();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

export async function GET() {
  const base = getAppUrl();
  const lastmod = getSitemapLastModified();

  // URLs estáticas principales
  const staticUrls = [
    {
      loc: `${base}/`,
      changefreq: "weekly",
      priority: 1,
    },
    {
      loc: `${base}/sobre-godcode`,
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      loc: `${base}/onboarding`,
      changefreq: "monthly",
      priority: 0.9,
    },
    {
      loc: `${base}/onboarding/negocios`,
      changefreq: "weekly",
      priority: 0.6,
    },
    {
      loc: `${base}/onboarding/terminos`,
      changefreq: "yearly",
      priority: 0.3,
    },
    {
      loc: `${base}/onboarding/privacidad`,
      changefreq: "yearly",
      priority: 0.3,
    },
  ];

  // Negocios activos
  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("public_slug,custom_domain,subscription_status")
    .in("subscription_status", ["active", "trial"])
    .not("public_slug", "is", null);

  let businessUrls: { loc: string; changefreq: string; priority: number }[] = [];
  if (companies) {
    for (const c of companies) {
      // Subdominio
      if (c.public_slug) {
        businessUrls.push({
          loc: `https://${escapeXml(c.public_slug)}.${base.replace(/^https?:\/\//, "")}/menu`,
          changefreq: "weekly",
          priority: 0.8,
        });
      }
      // Dominio personalizado
      if (c.custom_domain && c.subscription_status === "active") {
        businessUrls.push({
          loc: `https://${escapeXml(c.custom_domain)}/menu`,
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  // Construir XML
  const urls = [...staticUrls, ...businessUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u =>
      `  <url>\n` +
      `    <loc>${u.loc}</loc>\n` +
      `    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      `  </url>`
    ).join("\n") +
    `\n</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
