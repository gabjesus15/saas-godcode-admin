/**
 * Tenant checkout: fulfillment + delivery quote. Admin CRUD will persist `branches.delivery_settings`.
 * @see plan carrito_y_delivery_tenant
 */

export type DeliveryPricingMode = "per_km" | "tiered_km" | "fixed";

export type DeliveryTier = { up_to_km: number; fee: number };

export type DeliverySettings = {
	enabled: boolean;
	pickup_enabled: boolean;
	origin_lat: number | null;
	origin_lng: number | null;
	pricing_mode: DeliveryPricingMode;
	base_fee: number;
	per_km: number;
	included_km: number;
	tiers: DeliveryTier[];
	max_delivery_km: number | null;
	min_order_subtotal: number;
	customer_note: string | null;
};

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
	enabled: false,
	pickup_enabled: true,
	origin_lat: null,
	origin_lng: null,
	pricing_mode: "per_km",
	base_fee: 0,
	per_km: 0,
	included_km: 0,
	tiers: [],
	max_delivery_km: null,
	min_order_subtotal: 0,
	customer_note: null,
};

function num(v: unknown, fallback: number): number {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() !== "") {
		const n = Number(v);
		if (Number.isFinite(n)) return n;
	}
	return fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
	if (typeof v === "boolean") return v;
	return fallback;
}

function pricingMode(v: unknown): DeliveryPricingMode {
	const s = String(v || "").toLowerCase();
	if (s === "tiered_km" || s === "fixed" || s === "per_km") return s;
	return "per_km";
}

function parseTiers(raw: unknown): DeliveryTier[] {
	if (!Array.isArray(raw)) return [];
	const out: DeliveryTier[] = [];
	for (const row of raw) {
		if (!row || typeof row !== "object") continue;
		const o = row as Record<string, unknown>;
		out.push({
			up_to_km: num(o.up_to_km, 0),
			fee: num(o.fee, 0),
		});
	}
	return out;
}

/** Defensive parse for jsonb from `branches.delivery_settings`. */
export function parseDeliverySettings(raw: unknown): DeliverySettings {
	if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
		return { ...DEFAULT_DELIVERY_SETTINGS };
	}
	const o = raw as Record<string, unknown>;
	return {
		enabled: bool(o.enabled, DEFAULT_DELIVERY_SETTINGS.enabled),
		pickup_enabled: bool(o.pickup_enabled, DEFAULT_DELIVERY_SETTINGS.pickup_enabled),
		origin_lat: (() => {
			const n = num(o.origin_lat, NaN);
			return Number.isFinite(n) ? n : null;
		})(),
		origin_lng: (() => {
			const n = num(o.origin_lng, NaN);
			return Number.isFinite(n) ? n : null;
		})(),
		pricing_mode: pricingMode(o.pricing_mode),
		base_fee: Math.max(0, num(o.base_fee, 0)),
		per_km: Math.max(0, num(o.per_km, 0)),
		included_km: Math.max(0, num(o.included_km, 0)),
		tiers: parseTiers(o.tiers),
		max_delivery_km: (() => {
			if (o.max_delivery_km == null || o.max_delivery_km === "") return null;
			const n = num(o.max_delivery_km, NaN);
			return Number.isFinite(n) && n > 0 ? n : null;
		})(),
		min_order_subtotal: Math.max(0, num(o.min_order_subtotal, 0)),
		customer_note: typeof o.customer_note === "string" ? o.customer_note : null,
	};
}

/**
 * Fee from route km (driving proxy via haversine in v1). Server RPC should revalidate totals.
 */
export function computeDeliveryFeeFromRouteKm(
	settings: DeliverySettings,
	routeKm: number
): { fee: number; out_of_zone: boolean } {
	if (!settings.enabled || routeKm < 0 || !Number.isFinite(routeKm)) {
		return { fee: 0, out_of_zone: false };
	}
	if (settings.max_delivery_km != null && routeKm > settings.max_delivery_km) {
		return { fee: 0, out_of_zone: true };
	}
	if (settings.pricing_mode === "fixed") {
		return { fee: Math.round(Math.max(0, settings.base_fee)), out_of_zone: false };
	}
	if (settings.pricing_mode === "tiered_km" && settings.tiers.length > 0) {
		const sorted = [...settings.tiers].sort((a, b) => a.up_to_km - b.up_to_km);
		let fee = settings.base_fee;
		for (const t of sorted) {
			if (routeKm <= t.up_to_km) {
				fee = t.fee;
				break;
			}
			fee = t.fee;
		}
		return { fee: Math.round(Math.max(0, fee)), out_of_zone: false };
	}
	const extra = Math.max(0, routeKm - settings.included_km);
	const fee = settings.base_fee + extra * settings.per_km;
	return { fee: Math.round(Math.max(0, fee)), out_of_zone: false };
}

export function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}
