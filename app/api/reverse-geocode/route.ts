import { NextRequest, NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

function parseAddressParts(addr: Record<string, string | undefined>): {
	line1: string;
	commune: string;
} {
	const road =
		addr.road || addr.pedestrian || addr.path || addr.residential || "";
	const num = addr.house_number || "";
	let line1 = [road, num].filter(Boolean).join(" ").trim();
	if (!line1 && addr.neighbourhood) {
		line1 = addr.neighbourhood.trim();
	}
	const commune = (
		addr.city ||
		addr.town ||
		addr.village ||
		addr.suburb ||
		addr.municipality ||
		addr.county ||
		addr.state_district ||
		addr.state ||
		""
	)
		.toString()
		.trim();
	return { line1, commune };
}

/**
 * Geocodificación inversa (Nominatim) para rellenar calle y comuna tras GPS en el carrito.
 * Uso moderado: una petición por clic del usuario.
 */
export async function GET(req: NextRequest) {
	const lat = Number(req.nextUrl.searchParams.get("lat"));
	const lng = Number(req.nextUrl.searchParams.get("lng"));
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
	}
	if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
		return NextResponse.json({ error: "out_of_range" }, { status: 400 });
	}

	const url = new URL(NOMINATIM);
	url.searchParams.set("lat", String(lat));
	url.searchParams.set("lon", String(lng));
	url.searchParams.set("format", "json");
	url.searchParams.set("accept-language", "es");

	const ac = new AbortController();
	const t = setTimeout(() => ac.abort(), 8000);
	try {
		const res = await fetch(url.toString(), {
			signal: ac.signal,
			headers: {
				Accept: "application/json",
				"User-Agent": "saas-godcode-admin/1.0 (reverse-geocode; contact: app)",
			},
			next: { revalidate: 0 },
		});
		clearTimeout(t);
		if (!res.ok) {
			return NextResponse.json({ error: "upstream" }, { status: 502 });
		}
		const data = (await res.json()) as {
			address?: Record<string, string>;
			display_name?: string;
		};
		const addr = data.address ?? {};
		let { line1, commune } = parseAddressParts(addr);
		if (!line1 && data.display_name) {
			const first = data.display_name.split(",").map((s) => s.trim())[0];
			if (first) line1 = first;
		}
		if (!commune && data.display_name) {
			const parts = data.display_name.split(",").map((s) => s.trim());
			if (parts.length >= 2) commune = parts[1] ?? "";
		}
		return NextResponse.json({
			line1: line1.slice(0, 200),
			commune: commune.slice(0, 120),
		});
	} catch {
		clearTimeout(t);
		return NextResponse.json({ error: "failed" }, { status: 502 });
	}
}
