import { redirect } from "next/navigation";
import { headers } from "next/headers";

const tenantBaseDomain = (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "")
  .replace(/^https?:\/\//i, "")
  .replace(/\/$/, "")
  .toLowerCase();

function isMainDomain(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  // Playwright/CI y desarrollo local suelen usar 127.0.0.1 en lugar de localhost.
  if (h === "127.0.0.1") return true;
  if (!tenantBaseDomain) return h === "localhost" || h === "www.localhost";
  // Siempre llevar godcode.me y www.godcode.me (o el dominio configurado) a /login
  if (h === tenantBaseDomain || h === `www.${tenantBaseDomain}`) return true;
  if (tenantBaseDomain.startsWith("www.") && h === tenantBaseDomain.replace(/^www\./, "")) return true;
  return false;
}

function getSubdomainFromHost(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  if (!tenantBaseDomain || !h.endsWith(`.${tenantBaseDomain}`)) return null;
  const sub = h.slice(0, -(`.${tenantBaseDomain}`.length));
  if (!sub || sub === "www" || sub.includes(".")) return null;
  return sub;
}

export default async function Home() {
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  if (isMainDomain(host)) {
    redirect("/login");
    return null;
  }
  const subdomain = getSubdomainFromHost(host);
  if (subdomain) {
    redirect(`/${subdomain}`);
    return null;
  }
  return null;
}
