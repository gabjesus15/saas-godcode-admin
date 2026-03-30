import { NextRequest, NextResponse } from "next/server";

import { resolveNamedAreaFromAddress } from "../../../lib/delivery-area-resolve";
import {
	computeDeliveryFee,
	effectiveDeliveryPricingMode,
	normalizeDeliverySettings,
	orderItemsSubtotalFromPayload,
} from "../../../lib/delivery-settings";
import {
	buildGoogleMapsDirectionsUrl,
	haversineKm,
	isValidLatLng,
} from "../../../lib/geo";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const MAX_ORDER_AGE_MS = 10 * 60 * 1000;
const TOTAL_EPS = 2;
const FEE_EPS = 0.5;

function parseItems(raw: unknown): Array<{ price?: unknown; quantity?: unknown }> {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string") {
		try {
			const p = JSON.parse(raw);
			return Array.isArray(p) ? p : [];
		} catch {
			return [];
		}
	}
	return [];
}

function isDeliveryType(orderType: string): boolean {
	const t = orderType.trim().toLowerCase();
	return t === "delivery" || t === "envio" || t === "envío" || t === "despacho";
}

async function pickHandoffCode(): Promise<string> {
	for (let i = 0; i < 15; i++) {
		const code = String(Math.floor(100000 + Math.random() * 900000));
		const { data } = await supabaseAdmin
			.from("orders")
			.select("id")
			.eq("handoff_code", code)
			.maybeSingle();
		if (!data) return code;
	}
	return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Tras crear el pedido vía RPC, persiste metadatos de envío con validación server-side
 * (tarifa coherente con `branches.delivery_settings` y total = ítems + envío).
 */
export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as {
			orderId?: unknown;
			orderType?: unknown;
			deliveryKm?: unknown;
			deliveryLat?: unknown;
			deliveryLng?: unknown;
			deliveryAddress?: unknown;
			deliveryFee?: unknown;
			namedAreaId?: unknown;
		};

		const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
		const orderTypeRaw = String(body.orderType ?? "pickup");
		const deliveryKm = Number(body.deliveryKm);
		const deliveryFeeClient = Number(body.deliveryFee);
		const deliveryLat = Number(body.deliveryLat);
		const deliveryLng = Number(body.deliveryLng);
		const namedAreaIdRaw =
			typeof body.namedAreaId === "string" ? body.namedAreaId.trim() : "";

		if (!orderId) {
			return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
		}

		const { data: order, error: orderErr } = await supabaseAdmin
			.from("orders")
			.select("id, branch_id, total, items, created_at, status")
			.eq("id", orderId)
			.maybeSingle();

		if (orderErr || !order) {
			return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
		}

		const created = order.created_at ? new Date(String(order.created_at)) : null;
		if (
			!created ||
			!Number.isFinite(created.getTime()) ||
			Date.now() - created.getTime() > MAX_ORDER_AGE_MS
		) {
			return NextResponse.json(
				{ error: "Pedido no elegible para actualización de envío" },
				{ status: 400 },
			);
		}

		if (String(order.status) !== "pending") {
			return NextResponse.json({ error: "Solo pedidos pendientes" }, { status: 400 });
		}

		const { data: branch, error: brErr } = await supabaseAdmin
			.from("branches")
			.select("id, delivery_settings, origin_lat, origin_lng")
			.eq("id", order.branch_id)
			.maybeSingle();

		if (brErr || !branch) {
			return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 400 });
		}

		const items = parseItems(order.items);
		const subtotal = orderItemsSubtotalFromPayload(items);
		const settings = normalizeDeliverySettings(branch.delivery_settings);

		let expectedFee = 0;
		if (isDeliveryType(orderTypeRaw)) {
			if (!settings.enabled) {
				return NextResponse.json(
					{ error: "Delivery no habilitado en esta sucursal" },
					{ status: 400 },
				);
			}
			const pricingMode = effectiveDeliveryPricingMode(settings);
			let r: ReturnType<typeof computeDeliveryFee> | null = null;

			if (pricingMode === "named") {
				if (settings.namedAreaResolution === "address_matched") {
					const draftAddr =
						body.deliveryAddress &&
						typeof body.deliveryAddress === "object" &&
						!Array.isArray(body.deliveryAddress)
							? (body.deliveryAddress as Record<string, unknown>)
							: null;
					const addrLine = String(
						draftAddr?.address ?? draftAddr?.formatted_address ?? "",
					).trim();
					const resolved = await resolveNamedAreaFromAddress(
						settings,
						addrLine,
						subtotal,
					);
					if (!resolved.ok) {
						return NextResponse.json(
							{ error: resolved.message },
							{
								status:
									resolved.code === "ambiguous"
										? 409
										: resolved.code === "short_address"
											? 400
											: 400,
							},
						);
					}
					r = computeDeliveryFee(settings, 0, subtotal, {
						namedAreaId: resolved.namedAreaId,
					});
				} else {
					r = computeDeliveryFee(settings, 0, subtotal, {
						namedAreaId: namedAreaIdRaw || null,
					});
				}
			} else {
				const olat = Number(branch.origin_lat);
				const olng = Number(branch.origin_lng);
				let preciseKm =
					Number.isFinite(deliveryKm) && deliveryKm >= 0 ? deliveryKm : 0;
				if (
					isValidLatLng(deliveryLat, deliveryLng) &&
					isValidLatLng(olat, olng)
				) {
					preciseKm = haversineKm(
						{ lat: olat, lng: olng },
						{ lat: deliveryLat, lng: deliveryLng },
					);
				}
				if (
					settings.maxDeliveryKm != null &&
					preciseKm > settings.maxDeliveryKm + 1e-9
				) {
					r = { fee: -1, waivedFreeShipping: false };
				} else {
					const billedKm = Math.max(0, Math.round(preciseKm));
					r = computeDeliveryFee(settings, billedKm, subtotal);
				}
			}

			if (!r || r.fee < 0) {
				const fee = r?.fee ?? -1;
				const msg =
					fee === -1
						? "Distancia fuera del máximo permitido"
						: fee === -2
							? "No se alcanza el pedido mínimo para delivery"
							: fee === -3
								? "Debes elegir una zona de entrega"
								: "Zona de entrega no válida";
				return NextResponse.json({ error: msg }, { status: 400 });
			}
			expectedFee = Math.round(r.fee);
		} else {
			expectedFee = 0;
		}

		if (
			!Number.isFinite(deliveryFeeClient) ||
			Math.abs(deliveryFeeClient - expectedFee) > FEE_EPS
		) {
			return NextResponse.json({ error: "Tarifa de envío no válida" }, { status: 400 });
		}

		const expectedTotal = Math.round(subtotal + expectedFee);
		const orderTotal = Number(order.total) || 0;
		if (Math.abs(orderTotal - expectedTotal) > TOTAL_EPS) {
			return NextResponse.json(
				{ error: "Total del pedido no coincide con ítems + envío" },
				{ status: 400 },
			);
		}

		const deliveryAddress: Record<string, unknown> | null =
			isDeliveryType(orderTypeRaw) &&
			body.deliveryAddress &&
			typeof body.deliveryAddress === "object" &&
			!Array.isArray(body.deliveryAddress)
				? { ...(body.deliveryAddress as Record<string, unknown>) }
				: null;

		if (
			deliveryAddress &&
			isValidLatLng(deliveryLat, deliveryLng)
		) {
			deliveryAddress.lat = deliveryLat;
			deliveryAddress.lng = deliveryLng;
			deliveryAddress.maps_url = buildGoogleMapsDirectionsUrl(
				deliveryLat,
				deliveryLng,
			);
		}

		const handoff =
			isDeliveryType(orderTypeRaw) ? await pickHandoffCode() : null;

		const { error: upErr } = await supabaseAdmin
			.from("orders")
			.update({
				order_type: isDeliveryType(orderTypeRaw) ? "delivery" : "pickup",
				delivery_fee: expectedFee,
				delivery_address: deliveryAddress,
				...(handoff ? { handoff_code: handoff } : {}),
			})
			.eq("id", orderId)
			.eq("branch_id", order.branch_id);

		if (upErr) {
			return NextResponse.json({ error: upErr.message }, { status: 400 });
		}

		return NextResponse.json({
			ok: true,
			delivery_fee: expectedFee,
			handoff_code: handoff,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error en el servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
