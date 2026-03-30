import { NextRequest, NextResponse } from "next/server";

import { resolveNamedAreaFromAddress } from "../../../lib/delivery-area-resolve";
import {
	computeDeliveryFee,
	effectiveDeliveryPricingMode,
	normalizeDeliverySettings,
} from "../../../lib/delivery-settings";
import { haversineKm, isValidLatLng } from "../../../lib/geo";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function roundMoney(n: number): number {
	return Math.round(Number(n) || 0);
}

/**
 * Cotización pública de delivery (sin auth).
 * - Estrategia `distance`: coordenadas de entrega vs origen de la sucursal.
 * - Estrategia `named_areas` + manual: `namedAreaId`.
 * - Estrategia `named_areas` + address_matched: texto `address`.
 */
export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as {
			branchId?: unknown;
			lat?: unknown;
			lng?: unknown;
			subtotal?: unknown;
			namedAreaId?: unknown;
			address?: unknown;
		};

		const branchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
		const lat = Number(body.lat);
		const lng = Number(body.lng);
		const subtotal = Number(body.subtotal);
		const namedAreaId =
			typeof body.namedAreaId === "string" ? body.namedAreaId.trim() : "";
		const addressStr =
			typeof body.address === "string" ? body.address.trim() : "";

		if (!branchId) {
			return NextResponse.json({ error: "Falta branchId" }, { status: 400 });
		}
		if (!Number.isFinite(subtotal) || subtotal < 0) {
			return NextResponse.json({ error: "Subtotal inválido" }, { status: 400 });
		}

		const { data: branch, error } = await supabaseAdmin
			.from("branches")
			.select("id, delivery_settings, origin_lat, origin_lng")
			.eq("id", branchId)
			.maybeSingle();

		if (error || !branch) {
			return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
		}

		const settings = normalizeDeliverySettings(branch.delivery_settings);
		const mode = effectiveDeliveryPricingMode(settings);

		if (mode === "named") {
			if (settings.namedAreaResolution === "address_matched") {
				const resolved = await resolveNamedAreaFromAddress(
					settings,
					addressStr,
					subtotal,
				);
				if (!resolved.ok) {
					const status =
						resolved.code === "short_address"
							? 400
							: resolved.code === "ambiguous"
								? 409
								: 404;
					return NextResponse.json(
						{ error: resolved.message, code: resolved.code },
						{ status },
					);
				}
				return NextResponse.json({
					ok: true,
					mode: "named_area",
					namedAreaResolution: "address_matched",
					namedAreaId: resolved.namedAreaId,
					label: resolved.label,
					fee: roundMoney(resolved.fee),
					waivedFreeShipping: resolved.waivedFreeShipping,
				});
			}

			if (!namedAreaId) {
				return NextResponse.json(
					{ error: "Selecciona una zona de entrega", code: -3 },
					{ status: 400 },
				);
			}
			const r = computeDeliveryFee(settings, 0, subtotal, {
				namedAreaId,
			});
			if (r.fee < 0) {
				const msg =
					r.fee === -2
						? "No se alcanza el pedido mínimo para delivery"
						: r.fee === -4
							? "Zona de entrega no válida"
							: "No se pudo cotizar el envío";
				return NextResponse.json({ error: msg, code: r.fee }, { status: 400 });
			}
			return NextResponse.json({
				ok: true,
				mode: "named_area",
				namedAreaResolution: "manual_select",
				namedAreaId,
				fee: roundMoney(r.fee),
				waivedFreeShipping: r.waivedFreeShipping,
			});
		}

		if (!isValidLatLng(lat, lng)) {
			return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
		}

		const olat = Number(branch.origin_lat);
		const olng = Number(branch.origin_lng);
		if (!isValidLatLng(olat, olng)) {
			return NextResponse.json(
				{
					error:
						"Esta sucursal aún no tiene ubicación del local configurada para cotizar por distancia.",
				},
				{ status: 400 },
			);
		}

		const preciseKm = haversineKm({ lat: olat, lng: olng }, { lat, lng });
		if (
			settings.maxDeliveryKm != null &&
			preciseKm > settings.maxDeliveryKm + 1e-9
		) {
			return NextResponse.json(
				{
					error: "Distancia fuera del máximo permitido",
					code: -1,
				},
				{ status: 400 },
			);
		}
		const billedKm = Math.max(0, Math.round(preciseKm));
		const r = computeDeliveryFee(settings, billedKm, subtotal);

		if (r.fee < 0) {
			return NextResponse.json(
				{
					error:
						r.fee === -1
							? "Distancia fuera del máximo permitido"
							: "No se alcanza el pedido mínimo para delivery",
					code: r.fee,
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			ok: true,
			mode: "distance",
			distanceKm: billedKm,
			fee: roundMoney(r.fee),
			waivedFreeShipping: r.waivedFreeShipping,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
