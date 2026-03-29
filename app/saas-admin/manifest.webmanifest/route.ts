import { NextResponse } from "next/server";

/** Manifest PWA para instalar el panel super-admin (escritorio y móvil). */
export async function GET(req: Request) {
	let origin = "";
	try {
		origin = new URL(req.url).origin;
	} catch {
		origin = "";
	}

	const icon = origin ? `${origin}/globe.svg` : "/globe.svg";

	const manifest = {
		id: "/dashboard",
		name: "GodCode Admin",
		short_name: "GodCode Admin",
		description: "Panel super administración GodCode: empresas, planes, métricas y soporte.",
		start_url: "/dashboard",
		scope: "/",
		lang: "es",
		dir: "ltr",
		display: "standalone",
		orientation: "any",
		background_color: "#0a0a0a",
		theme_color: "#111827",
		icons: [
			{
				src: icon,
				sizes: "any",
				type: "image/svg+xml",
				purpose: "any",
			},
			{
				src: icon,
				sizes: "512x512",
				type: "image/svg+xml",
				purpose: "maskable",
			},
		],
	};

	return NextResponse.json(manifest, {
		headers: {
			"Cache-Control": "public, max-age=300",
			"Content-Type": "application/manifest+json; charset=utf-8",
		},
	});
}
