type PlanPricingMap = Record<string, { price: number; currency: string }>;

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  ve: "Latinoamerica",
  venezuela: "Latinoamerica",
  cl: "Latinoamerica",
  chile: "Latinoamerica",
  co: "Latinoamerica",
  colombia: "Latinoamerica",
  ar: "Latinoamerica",
  argentina: "Latinoamerica",
  mx: "Latinoamerica",
  mexico: "Latinoamerica",
  pe: "Latinoamerica",
  peru: "Latinoamerica",
  ec: "Latinoamerica",
  ecuador: "Latinoamerica",
  us: "USA/Canada",
  usa: "USA/Canada",
  "u.s.a": "USA/Canada",
  "united states": "USA/Canada",
  estadosunidos: "USA/Canada",
  estadosunidosdeamerica: "USA/Canada",
  ca: "USA/Canada",
  canada: "USA/Canada",
  es: "Europe",
  espana: "Europe",
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

function resolveContinentFromCountryInput(country: string | null | undefined): string {
  const token = normalizeCountryToken(country);
  if (!token) return "Latinoamerica";
  return COUNTRY_TO_CONTINENT[token] ?? "Latinoamerica";
}

export function resolveRegionalPlanPrice(
  plan: {
    price?: number | null;
    pricesByContinent?: PlanPricingMap | null;
    prices_by_continent?: PlanPricingMap | null;
  },
  country: string | null | undefined,
): {
  continent: string;
  price: number;
  currency: string;
  source: "regional" | "fallback";
} {
  const continent = resolveContinentFromCountryInput(country);
  const priceMap = plan.pricesByContinent ?? plan.prices_by_continent ?? {};

  // Keep compatibility with existing records that use accented key names.
  const latinKey = "Latinoamérica";
  const regional =
    priceMap[continent] ??
    priceMap[latinKey] ??
    priceMap["Latinoamerica"] ??
    Object.values(priceMap)[0] ??
    null;

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
