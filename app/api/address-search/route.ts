import { NextRequest, NextResponse } from "next/server";

import { photonSearchAddressHits } from "../../../lib/delivery-area-resolve";
import { deliveryPublicRateOk } from "../../../lib/delivery-public-limiter";

function clientKey(req: NextRequest): string {
	const xf = req.headers.get("x-forwarded-for");
	if (xf) return xf.split(",")[0]?.trim() || "unknown";
	return "unknown";
}

/**
 * Autocompletado de direcciones vía Photon (OSM), mismo backend que la resolución de zonas.
 * Público, con rate limit.
 */
export async function GET(req: NextRequest) {
	try {
		const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
		if (raw.length < 3) {
			return NextResponse.json({ ok: true as const, results: [] });
		}

		const ip = clientKey(req);
		if (!deliveryPublicRateOk(`addr-search:${ip}`, 40, 60_000)) {
			return NextResponse.json(
				{ error: "Demasiadas consultas. Espera un momento." },
				{ status: 429 },
			);
		}

		const nearLatRaw = req.nextUrl.searchParams.get("nearLat");
		const nearLonRaw = req.nextUrl.searchParams.get("nearLon");
		const nearLat = nearLatRaw != null ? Number(nearLatRaw) : NaN;
		const nearLon = nearLonRaw != null ? Number(nearLonRaw) : NaN;
		const bias =
			Number.isFinite(nearLat) && Number.isFinite(nearLon)
				? { nearLat, nearLon }
				: undefined;

		const results = await photonSearchAddressHits(raw, bias);
		return NextResponse.json({
			ok: true as const,
			results: results ?? [],
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
