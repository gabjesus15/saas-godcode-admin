import "server-only";

import { normalizeMarketingLines } from "./plan-marketing-lines";
import { queryPublicPlansLandingRows } from "./plans-db-query";
import type { CountryCode } from "./landing-geo-plans";
import { getPlanTagByCountry } from "./landing-geo-plans";

export type PublicPlanForLanding = {
  id: string;
  name: string;
  pricesByContinent: Record<string, { price: number; currency: string }>;
  max_branches: number;
  max_users: number;
  featureBullets: string[];
};

function bulletsFromPlan(row: {
  max_branches: number | null;
  max_users: number | null;
  marketing_lines?: unknown;
}): string[] {
  const custom = normalizeMarketingLines(row.marketing_lines);
  const base: string[] = [];
  const maxB = row.max_branches ?? 0;
  const maxU = row.max_users ?? 0;
  if (maxB > 0) {
    base.push(`Hasta ${maxB} sucursal${maxB === 1 ? "" : "es"}`);
  }
  if (maxU > 0) {
    base.push(`Hasta ${maxU} usuario${maxU === 1 ? "" : "s"}`);
  }
  const merged = [...base, ...custom];
  if (merged.length === 0) {
    return ["Detalles del plan configurables desde el panel"];
  }
  return merged;
}

/**
 * Planes visibles en la landing: `is_public` y activos (`is_active` no es false).
 * Si se especifica un país, intenta filtrar por un tag específico del país.
 * Orden por precio ascendente (como en el panel de planes).
 */
export async function getPublicPlansForLanding(country?: CountryCode): Promise<PublicPlanForLanding[]> {
  const { data, error } = await queryPublicPlansLandingRows();

  if (error) {
    console.error("[getPublicPlansForLanding]", error.message);
    return [];
  }

  const rows = (data ?? []).filter((p) => p.is_active !== false);

  // Si hay un país especificado, filtrar por tag del país en marketing_lines
  // Para ahora, retorna todos los planes (se pueden aplicar precios diferentes por país en el componente)
  if (country && country !== "OTHER") {
    // Placeholder: aquí puedes añadir lógica de filtrado por país en la BD
    // Por ejemplo: rows = rows.filter(p => p.country_code === country)
  }

  return rows.map((p) => {
    const pricesByContinent = typeof p.prices_by_continent === 'object' && p.prices_by_continent !== null 
      ? p.prices_by_continent as Record<string, { price: number; currency: string }>
      : {};
    
    return {
      id: p.id,
      name: (p.name ?? "Plan").trim() || "Plan",
      pricesByContinent,
      max_branches: p.max_branches ?? 0,
      max_users: p.max_users ?? 0,
      featureBullets: bulletsFromPlan(p),
    };
  });
}

/** Índice del plan destacado estilo “Popular” (centro de la lista). */
export function popularPlanIndex(count: number): number {
  if (count <= 1) return 0;
  return Math.floor(count / 2);
}
