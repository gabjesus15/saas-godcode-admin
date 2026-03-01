import { NextRequest, NextResponse } from "next/server";
import { createSupabasePublicServerClient } from "../../../utils/supabase/server";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "GC";
};

const buildFallbackSvg = (name: string, color: string) => {
  const initials = getInitials(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="${color}"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="700">${initials}</text></svg>`;
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await context.params;

  const supabase = createSupabasePublicServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id,name,subscription_status,theme_config")
    .eq("public_slug", subdomain)
    .maybeSingle();

  const name = company?.theme_config?.displayName ?? company?.name ?? "GodCode";
  const primaryColor = company?.theme_config?.primaryColor ?? "#111827";
  const logoUrl = company?.theme_config?.logoUrl as string | undefined;
  const status = company?.subscription_status?.toLowerCase();

  if (logoUrl && status !== "suspended" && status !== "cancelled") {
    try {
      const upstream = await fetch(logoUrl, { cache: "no-store" });
      if (upstream.ok) {
        const contentType = upstream.headers.get("content-type") || "image/png";
        const body = await upstream.arrayBuffer();

        return new NextResponse(body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    } catch {
      // Fallback handled below.
    }
  }

  const svg = buildFallbackSvg(name, primaryColor);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
