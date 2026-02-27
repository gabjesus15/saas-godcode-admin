const normalizeBaseDomain = (value: string) =>
  value.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const getTenantBaseDomain = () => {
  const raw = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  if (raw && raw.trim()) {
    return normalizeBaseDomain(raw.trim());
  }

  if (process.env.NODE_ENV === "development") {
    return "localhost:3000";
  }

  return "tuapp.com";
};

export const getTenantHost = (slug: string) => {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return "";
  }

  return `${safeSlug}.${getTenantBaseDomain()}`;
};

export const getTenantUrl = (slug: string) => {
  const host = getTenantHost(slug);
  if (!host) {
    return "";
  }

  const protocolOverride = process.env.NEXT_PUBLIC_TENANT_PROTOCOL;
  const isLocal = host.includes("localhost") || host.startsWith("127.0.0.1");
  const protocol = protocolOverride?.trim()
    ? protocolOverride.trim()
    : isLocal
      ? "http"
      : "https";

  return `${protocol}://${host}`;
};
