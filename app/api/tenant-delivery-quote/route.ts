import { NextResponse } from "next/server";
import { haversineKm } from "../../../lib/tenant-delivery-settings";

/**
 * Quote route km (v1: haversine straight-line). ADMIN-HOOK: swap for Mapbox/Google driving when key is set.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const oLat = Number(body.origin_lat);
		const oLng = Number(body.origin_lng);
		const dLat = Number(body.dest_lat);
		const dLng = Number(body.dest_lng);
		if (![oLat, oLng, dLat, dLng].every((n) => Number.isFinite(n))) {
			return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
		}
		const route_km = haversineKm(oLat, oLng, dLat, dLng);
		return NextResponse.json({
			route_km,
			source: "haversine",
		});
	} catch {
		return NextResponse.json({ error: "bad_request" }, { status: 400 });
	}
}
