import type { Metadata } from "next";
import type { ReactNode } from "react";

import { createSupabaseServerClient } from "../../utils/supabase/server";
import { StoreUnavailable } from "../../components/tenant/store-unavailable";

interface TenantLayoutProps {
  children: ReactNode;
  params: { subdomain: string };
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

const fetchCompany = async (subdomain: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id,name,public_slug,subscription_status,theme_config")
    .eq("public_slug", subdomain)
    .maybeSingle();

  return company;
};

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  const company = await fetchCompany(params.subdomain);

  if (!company) {
    return { title: "GodCode" };
  }

  const status = company.subscription_status?.toLowerCase();
  if (status === "suspended" || status === "cancelled") {
    return { title: "GodCode" };
  }

  const name = company.name ?? "GodCode";
  const primaryColor = company.theme_config?.primaryColor ?? "#111827";
  const icon = company.theme_config?.logoUrl
    ? company.theme_config.logoUrl
    : buildInitialsIcon(name, primaryColor);

  return {
    title: name,
    icons: { icon },
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const company = await fetchCompany(params.subdomain);

  if (!company) {
    return <StoreUnavailable />;
  }

  const status = company.subscription_status?.toLowerCase();
  if (status === "suspended" || status === "cancelled") {
    return <StoreUnavailable />;
  }

  const primaryColor = company.theme_config?.primaryColor ?? "#111827";

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={{ "--tenant-primary": primaryColor } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
