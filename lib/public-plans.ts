import "server-only";

import { supabaseAdmin } from "./supabase-admin";

/** Etiquetas para claves booleanas en `plans.features` (JSON). */
const FEATURE_LABELS: Record<string, string> = {
  crm: "CRM",
  cash: "Caja",
  menu: "Menú",
};

export type PublicPlanForLanding = {
  id: string;
  name: string;
  price: number;
  max_branches: number;
  max_users: number;
  featureBullets: string[];
};

function bulletsFromPlan(row: {
  max_branches: number | null;
  max_users: number | null;
  features: unknown;
}): string[] {
  const bullets: string[] = [];
  const maxB = row.max_branches ?? 0;
  const maxU = row.max_users ?? 0;
  if (maxB > 0) {
    bullets.push(`Hasta ${maxB} sucursal${maxB === 1 ? "" : "es"}`);
  }
  if (maxU > 0) {
    bullets.push(`Hasta ${maxU} usuario${maxU === 1 ? "" : "s"}`);
  }
  const f = row.features;
  if (f && typeof f === "object" && !Array.isArray(f)) {
    for (const [key, val] of Object.entries(f as Record<string, unknown>)) {
      if (val === true) {
        bullets.push(FEATURE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1));
      }
    }
  }
  if (bullets.length === 0) {
    bullets.push("Incluye las funciones configuradas para este plan");
  }
  return bullets;
}

/**
 * Planes visibles en la landing: `is_public` y activos (`is_active` no es false).
 * Orden por precio ascendente (como en el panel de planes).
 */
export async function getPublicPlansForLanding(): Promise<PublicPlanForLanding[]> {
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("id,name,price,max_branches,max_users,features,is_active")
    .eq("is_public", true)
    .order("price", { ascending: true });

  if (error) {
    console.error("[getPublicPlansForLanding]", error.message);
    return [];
  }

  const rows = (data ?? []).filter((p) => p.is_active !== false);

  return rows.map((p) => ({
    id: p.id,
    name: (p.name ?? "Plan").trim() || "Plan",
    price: Number(p.price ?? 0),
    max_branches: p.max_branches ?? 0,
    max_users: p.max_users ?? 0,
    featureBullets: bulletsFromPlan(p),
  }));
}

/** Índice del plan destacado estilo “Popular” (centro de la lista). */
export function popularPlanIndex(count: number): number {
  if (count <= 1) return 0;
  return Math.floor(count / 2);
}
