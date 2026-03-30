/**
 * Resolución de dirección → zona con nombre (namedAreas) vía Photon (OSM), gratis.
 * Usado en APIs públicas con rate limit; la lógica de tarifa sigue en computeDeliveryFee.
 */

import {
	computeDeliveryFee,
	type DeliveryNamedArea,
	type DeliverySettingsNormalized,
} from "./delivery-settings";

const PHOTON = "https://photon.komoot.io/api/";
const MIN_ADDRESS_LEN = 8;

export type ResolveNamedAreaResult =
	| {
			ok: true;
			namedAreaId: string;
			label: string;
			fee: number;
			waivedFreeShipping: boolean;
	  }
	| {
			ok: false;
			code: "short_address" | "geocode_failed" | "no_match" | "ambiguous";
			message: string;
	  };

function norm(s: string): string {
	return s
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9áéíóúüñ\s]/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function collectGeocodeStrings(props: Record<string, unknown>): string[] {
	const keys = [
		"name",
		"city",
		"district",
		"locality",
		"county",
		"state",
		"country",
	] as const;
	const out: string[] = [];
	for (const k of keys) {
		const v = props[k];
		if (typeof v === "string" && v.trim()) out.push(v.trim());
	}
	return out;
}

function areaSearchStrings(area: DeliveryNamedArea): string[] {
	const out = [area.name];
	const aliases = area.aliases;
	if (Array.isArray(aliases)) {
		for (const a of aliases) {
			if (typeof a === "string" && a.trim()) out.push(a.trim());
		}
	}
	return out;
}

/** Puntuación simple: coincidencia por inclusión o token compartido. */
function scoreAreaAgainstBlob(
	area: DeliveryNamedArea,
	blobNorm: string,
	tokens: Set<string>,
): number {
	let best = 0;
	for (const raw of areaSearchStrings(area)) {
		const n = norm(raw);
		if (!n) continue;
		if (blobNorm.includes(n) || n.includes(blobNorm)) {
			best = Math.max(best, 100 + n.length);
			continue;
		}
		const areaTokens = new Set(n.split(" ").filter((t) => t.length > 2));
		let overlap = 0;
		for (const t of areaTokens) {
			if (tokens.has(t)) overlap += 10;
		}
		best = Math.max(best, overlap);
	}
	return best;
}

export async function photonForwardGeocode(address: string): Promise<
	Record<string, unknown>[] | null
> {
	const q = address.trim();
	if (q.length < MIN_ADDRESS_LEN) return null;
	const url = new URL(PHOTON);
	url.searchParams.set("q", q.slice(0, 200));
	url.searchParams.set("lang", "default");
	url.searchParams.set("limit", "8");
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), 12_000);
	try {
		const res = await fetch(url.toString(), {
			signal: ctrl.signal,
			cache: "no-store",
			headers: { Accept: "application/json" },
		});
		clearTimeout(t);
		if (!res.ok) return null;
		const data = (await res.json()) as { features?: unknown[] };
		const feats = Array.isArray(data.features) ? data.features : [];
		const props: Record<string, unknown>[] = [];
		for (const f of feats) {
			if (!f || typeof f !== "object") continue;
			const p = (f as { properties?: unknown }).properties;
			if (p && typeof p === "object" && !Array.isArray(p)) {
				props.push(p as Record<string, unknown>);
			}
		}
		return props.length > 0 ? props : null;
	} catch {
		clearTimeout(t);
		return null;
	}
}

/**
 * Intenta mapear una dirección en texto a una fila de namedAreas y calcular tarifa.
 */
export async function resolveNamedAreaFromAddress(
	settings: DeliverySettingsNormalized,
	addressText: string,
	itemsSubtotal: number,
): Promise<ResolveNamedAreaResult> {
	const areas = settings.namedAreas;
	if (!areas.length) {
		return {
			ok: false,
			code: "no_match",
			message: "Este local no tiene zonas por nombre configuradas.",
		};
	}

	const trimmed = addressText.trim();
	if (trimmed.length < MIN_ADDRESS_LEN) {
		return {
			ok: false,
			code: "short_address",
			message: "Escribe una dirección más completa (calle, número y comuna o ciudad).",
		};
	}

	const geoPropsList = await photonForwardGeocode(trimmed);
	if (!geoPropsList || geoPropsList.length === 0) {
		return {
			ok: false,
			code: "geocode_failed",
			message: "No pudimos ubicar esa dirección. Revisa e intenta de nuevo.",
		};
	}

	const allStrings: string[] = [];
	for (const props of geoPropsList) {
		allStrings.push(...collectGeocodeStrings(props));
	}
	const blob = allStrings.join(" · ");
	const blobNorm = norm(blob);
	const tokenSet = new Set(blobNorm.split(" ").filter((x) => x.length > 2));

	let bestScore = 0;
	const scored: { area: DeliveryNamedArea; s: number }[] = [];
	for (const area of areas) {
		const s = scoreAreaAgainstBlob(area, blobNorm, tokenSet);
		scored.push({ area, s });
		bestScore = Math.max(bestScore, s);
	}

	const winners = scored.filter((x) => x.s === bestScore && x.s >= 10);
	if (winners.length === 0) {
		return {
			ok: false,
			code: "no_match",
			message:
				"No reconocemos esa zona en la lista del local. Elige otra dirección o contacta al local.",
		};
	}
	if (winners.length > 1) {
		return {
			ok: false,
			code: "ambiguous",
			message:
				"Hay varias zonas posibles. Añade más detalle en la dirección (comuna o ciudad).",
		};
	}

	const bestArea = winners[0].area;

	const r = computeDeliveryFee(settings, 0, itemsSubtotal, {
		namedAreaId: bestArea.id,
	});
	if (r.fee < 0) {
		const msg =
			r.fee === -2
				? "El pedido no alcanza el mínimo para envío a esa zona."
				: "No se pudo calcular el envío para esa zona.";
		return { ok: false, code: "no_match", message: msg };
	}

	return {
		ok: true,
		namedAreaId: bestArea.id,
		label: bestArea.name,
		fee: r.fee,
		waivedFreeShipping: r.waivedFreeShipping,
	};
}

/** Resultado de búsqueda (Photon) para autocompletar dirección en checkout público. */
export type PhotonAddressHit = {
	lat: number;
	lng: number;
	label: string;
	line1: string;
	commune: string;
};

const PHOTON_SEARCH_MIN_LEN = 3;

function buildLine1FromPhotonProps(p: Record<string, unknown>): string {
	const street = typeof p.street === "string" ? p.street.trim() : "";
	const hn = typeof p.housenumber === "string" ? p.housenumber.trim() : "";
	const joined = [street, hn].filter(Boolean).join(" ").trim();
	if (joined) return joined.slice(0, 200);
	const name = typeof p.name === "string" ? p.name.trim() : "";
	return name.slice(0, 200);
}

function buildCommuneFromPhotonProps(p: Record<string, unknown>): string {
	const city =
		(typeof p.city === "string" && p.city.trim()) ||
		(typeof p.town === "string" && p.town.trim()) ||
		(typeof p.district === "string" && p.district.trim()) ||
		(typeof p.locality === "string" && p.locality.trim()) ||
		(typeof p.county === "string" && p.county.trim()) ||
		"";
	return city.slice(0, 120);
}

/**
 * Búsqueda directa en Photon (mismo origen que la resolución de zonas por dirección).
 * Opcional: `nearLat`/`nearLon` para sesgar resultados hacia la sucursal.
 */
export async function photonSearchAddressHits(
	address: string,
	options?: { nearLat?: number | null; nearLon?: number | null },
): Promise<PhotonAddressHit[] | null> {
	const q = address.trim();
	if (q.length < PHOTON_SEARCH_MIN_LEN) return null;

	const url = new URL(PHOTON);
	url.searchParams.set("q", q.slice(0, 200));
	url.searchParams.set("lang", "default");
	url.searchParams.set("limit", "8");
	const nLat = options?.nearLat != null ? Number(options.nearLat) : NaN;
	const nLon = options?.nearLon != null ? Number(options.nearLon) : NaN;
	if (Number.isFinite(nLat) && Number.isFinite(nLon)) {
		url.searchParams.set("lat", String(nLat));
		url.searchParams.set("lon", String(nLon));
	}

	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), 12_000);
	try {
		const res = await fetch(url.toString(), {
			signal: ctrl.signal,
			cache: "no-store",
			headers: { Accept: "application/json" },
		});
		clearTimeout(t);
		if (!res.ok) return null;
		const data = (await res.json()) as { features?: unknown[] };
		const feats = Array.isArray(data.features) ? data.features : [];
		const hits: PhotonAddressHit[] = [];
		for (const f of feats) {
			if (!f || typeof f !== "object") continue;
			const feat = f as {
				geometry?: { type?: string; coordinates?: unknown };
				properties?: unknown;
			};
			if (feat.geometry?.type !== "Point") continue;
			const coords = feat.geometry?.coordinates;
			if (!Array.isArray(coords) || coords.length < 2) continue;
			const lng = Number(coords[0]);
			const lat = Number(coords[1]);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
			const pr = feat.properties;
			if (!pr || typeof pr !== "object" || Array.isArray(pr)) continue;
			const props = pr as Record<string, unknown>;
			const line1 = buildLine1FromPhotonProps(props);
			const commune = buildCommuneFromPhotonProps(props);
			const label =
				[line1, commune].filter(Boolean).join(", ").trim() ||
				(typeof props.name === "string" ? props.name.trim() : "") ||
				"Ubicación";
			hits.push({
				lat,
				lng,
				label: label.slice(0, 220),
				line1: line1 || label.slice(0, 200),
				commune,
			});
		}
		return hits.length > 0 ? hits : null;
	} catch {
		clearTimeout(t);
		return null;
	}
}
