export const normalizeBaseDomain = (value: string) => {
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

const shouldUsePathRouting = (baseDomain: string) => {
  const cleanHost = baseDomain.toLowerCase();
  return isLocalhostLike(cleanHost) || cleanHost.endsWith(".vercel.app");
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

  return process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() || "tuapp.com";
};

/**
 * Igual que la resolución de `getTenantBaseDomain` pero **sin** `window`.
 * Para textos en componentes cliente con SSR y evitar errores de hidratación.
 */
export const getTenantBaseDomainStatic = () => {
  const raw = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  if (raw && raw.trim()) {
    const normalizedRaw = normalizeBaseDomain(raw.trim());
    const isProduction = process.env.NODE_ENV === "production";
    if (!(isProduction && isLocalhostLike(normalizedRaw))) {
      return normalizedRaw;
    }
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

  return process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() || "tuapp.com";
};

export const getTenantHost = (slug: string, customDomain?: string | null) => {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return "";
  }

  const custom = customDomain?.trim();
  if (custom) {
    return normalizeBaseDomain(custom);
  }

  const baseDomain = getTenantBaseDomain();
  if (shouldUsePathRouting(baseDomain)) {
    return `${baseDomain}/${safeSlug}`;
  }

  return `${safeSlug}.${baseDomain}`;
};

export const getTenantUrl = (slug: string, customDomain?: string | null) => {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return "";
  }

  const custom = customDomain?.trim();
  if (custom) {
    const host = normalizeBaseDomain(custom);
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
    return `${protocol}://${host}/`;
  }

  const baseDomain = getTenantBaseDomain();
  if (!baseDomain) {
    return "";
  }

  const protocolOverride = process.env.NEXT_PUBLIC_TENANT_PROTOCOL;
  const isLocal = baseDomain.includes("localhost") || baseDomain.startsWith("127.0.0.1");
  const protocol = protocolOverride?.trim()
    ? protocolOverride.trim()
    : isLocal
      ? "http"
      : "https";

  // Siempre formato dominio.com/negocio
  return `${protocol}://${baseDomain}/${safeSlug}`;
};

/** URL pública del menú (sin /slug en la ruta cuando hay dominio personalizado). */
export const getTenantMenuUrl = (slug: string, customDomain?: string | null) => {
  const base = getTenantUrl(slug, customDomain).replace(/\/$/, "");
  if (!base) {
    return "";
  }
  return `${base}/menu`;
};
