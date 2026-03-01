import type { Metadata } from "next";
import type { ReactNode } from "react";

import { createSupabasePublicServerClient } from "../../utils/supabase/server";
import "./tenant.css";
import { TenantShell } from "../../components/tenant/tenant-shell";

export const dynamic = "force-dynamic";

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<{ subdomain: string }>;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "GC";
};

const buildInitialsIcon = (name: string, color: string) => {
  const initials = getInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="${color}"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const toRgba = (hex: string, alpha: number, fallback: string) => {
  if (!hex) return fallback;
  const normalized = hex.trim();
  const shortMatch = /^#([a-fA-F0-9]{3})$/.exec(normalized);
  const longMatch = /^#([a-fA-F0-9]{6})$/.exec(normalized);

  const hexValue = shortMatch
    ? shortMatch[1]
        .split("")
        .map((char) => char + char)
        .join("")
    : longMatch
      ? longMatch[1]
      : null;

  if (!hexValue) return fallback;

  const r = Number.parseInt(hexValue.slice(0, 2), 16);
  const g = Number.parseInt(hexValue.slice(2, 4), 16);
  const b = Number.parseInt(hexValue.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fetchCompany = async (subdomain: string) => {
  const supabase = createSupabasePublicServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id,name,public_slug,subscription_status,theme_config,updated_at")
    .eq("public_slug", subdomain)
    .maybeSingle();

  return company;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const company = await fetchCompany(resolvedParams.subdomain);

  if (!company) {
    return { title: "GodCode" };
  }

  const status = company.subscription_status?.toLowerCase();
  if (status === "suspended" || status === "cancelled") {
    return { title: "GodCode" };
  }

  const name = company.theme_config?.displayName ?? company.name ?? "GodCode";
  const versionSeed = String(company.updated_at ?? company.id ?? name);
  const icon = `/${resolvedParams.subdomain}/tenant-favicon?v=${encodeURIComponent(versionSeed)}`;

  return {
    title: name,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const resolvedParams = await params;
  const company = await fetchCompany(resolvedParams.subdomain);
  const status = company?.subscription_status?.toLowerCase();
  const primaryColor = company?.theme_config?.primaryColor ?? "#111827";
  const secondaryColor = company?.theme_config?.secondaryColor ?? primaryColor;
  const priceColor = company?.theme_config?.priceColor ?? "#ff4757";
  const discountColor = company?.theme_config?.discountColor ?? "#25d366";
  const hoverColor = company?.theme_config?.hoverColor ?? "#ff2e40";
  const accentShadow = toRgba(primaryColor, 0.3, "rgba(255, 71, 87, 0.3)");
  const accentShadowStrong = toRgba(
    primaryColor,
    0.5,
    "rgba(255, 71, 87, 0.5)"
  );
  const cardBorder = toRgba(primaryColor, 0.18, "rgba(255, 255, 255, 0.1)");
  const backgroundColor =
    company?.theme_config?.backgroundColor ?? "#0a0a0a";
  const backgroundImageUrl =
    company?.theme_config?.backgroundImageUrl ?? "/tenant/menu-pattern.webp";
  const backgroundImage = backgroundImageUrl
    ? `url(${backgroundImageUrl}), url(/tenant/menu-pattern.webp)`
    : "url(/tenant/menu-pattern.webp)";

  return (
    <div
      style={{
        "--tenant-primary": primaryColor,
        "--accent-primary": primaryColor,
        "--accent-secondary": secondaryColor,
        "--price-color": priceColor,
        "--discount-color": discountColor,
        "--accent-hover": hoverColor,
        "--accent-shadow": accentShadow,
        "--accent-shadow-strong": accentShadowStrong,
        "--card-border": cardBorder,
        "--bg-primary": backgroundColor,
        "--tenant-bg-image": backgroundImage,
      } as React.CSSProperties}
    >
      <TenantShell>{children}</TenantShell>
    </div>
  );
}
