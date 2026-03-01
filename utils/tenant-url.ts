const normalizeBaseDomain = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.host.toLowerCase().replace(/^www\./, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .toLowerCase()
      .replace(/^www\./, "");
  }
};

const isLocalhostLike = (host: string) => {
  const cleanHost = host.toLowerCase();
  return (
    cleanHost === "localhost" ||
    cleanHost.startsWith("localhost:") ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.includes(".localhost:") ||
    cleanHost.startsWith("127.0.0.1")
  );
};

const getRuntimeHostBase = () => {
  if (typeof window === "undefined") return null;

  const host = window.location.host.toLowerCase().replace(/^www\./, "");
  if (!host) return null;

  if (host.endsWith("localhost") || host.endsWith("localhost:3000")) {
    return host;
  }

  if (host.endsWith(".vercel.app")) {
    return host;
  }

  return host;
};

export const getTenantBaseDomain = () => {
  const raw = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  if (raw && raw.trim()) {
    const normalizedRaw = normalizeBaseDomain(raw.trim());
    const isProduction = process.env.NODE_ENV === "production";

    // Evita URLs rotas en Vercel cuando quedó seteado localhost en variables públicas.
    if (!(isProduction && isLocalhostLike(normalizedRaw))) {
      return normalizedRaw;
    }
  }

  const runtimeHost = getRuntimeHostBase();
  if (runtimeHost) {
    return runtimeHost;
  }

  const vercelProdHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdHost && vercelProdHost.trim()) {
    return normalizeBaseDomain(vercelProdHost);
  }

  const vercelPreviewHost = process.env.VERCEL_URL;
  if (vercelPreviewHost && vercelPreviewHost.trim()) {
    return normalizeBaseDomain(vercelPreviewHost);
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
