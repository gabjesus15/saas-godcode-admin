import type { Continent } from "./landing-geo-plans";

type PlanPricingMap = Record<string, { price: number; currency: string }>;

const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  ve: "Latinoamérica",
  venezuela: "Latinoamérica",
  cl: "Latinoamérica",
  chile: "Latinoamérica",
  co: "Latinoamérica",
  colombia: "Latinoamérica",
  ar: "Latinoamérica",
  argentina: "Latinoamérica",
  mx: "Latinoamérica",
  méxico: "Latinoamérica",
  mexico: "Latinoamérica",
  pe: "Latinoamérica",
  perú: "Latinoamérica",
  peru: "Latinoamérica",
  ec: "Latinoamérica",
  ecuador: "Latinoamérica",
  us: "USA/Canada",
  usa: "USA/Canada",
  "u.s.a": "USA/Canada",
  "united states": "USA/Canada",
  estadosunidos: "USA/Canada",
  estadosunidosdeamerica: "USA/Canada",
  ca: "USA/Canada",
  canada: "USA/Canada",
  canadá: "USA/Canada",
  es: "Europe",
  españa: "Europe",
  spain: "Europe",
};

function normalizeCountryToken(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

export function resolveContinentFromCountryInput(country: string | null | undefined): Continent {
  const token = normalizeCountryToken(country);
  if (!token) return "Latinoamérica";
  return COUNTRY_TO_CONTINENT[token] ?? "Latinoamérica";
}

export function resolveRegionalPlanPrice(plan: {
  price?: number | null;
  pricesByContinent?: PlanPricingMap | null;
  prices_by_continent?: PlanPricingMap | null;
}, country: string | null | undefined): {
  continent: Continent;
  price: number;
  currency: string;
  source: "regional" | "fallback";
} {
  const continent = resolveContinentFromCountryInput(country);
  const priceMap = plan.pricesByContinent ?? plan.prices_by_continent ?? {};
  const regional = priceMap[continent] ?? priceMap["Latinoamérica"] ?? Object.values(priceMap)[0] ?? null;
  if (regional && typeof regional.price === "number") {
    return {
      continent,
      price: Number(regional.price ?? 0),
      currency: String(regional.currency ?? "USD").toUpperCase(),
      source: "regional",
    };
  }
  return {
    continent,
    price: Number(plan.price ?? 0),
    currency: "USD",
    source: "fallback",
  };
}
