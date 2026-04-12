import { NextRequest, NextResponse } from "next/server";
import {
	Client,
	Environment,
	OrdersController,
} from "@paypal/paypal-server-sdk";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { hashPaymentIdentity, normalizeEmail } from "../../../../lib/onboarding/trial-eligibility";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as { orderId?: string; token?: string };
		const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
		const token = typeof body.token === "string" ? body.token.trim() : "";

		if (!orderId) {
			return NextResponse.json({ error: "orderId faltante" }, { status: 400 });
		}

		if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
			return NextResponse.json({ error: "PayPal no configurado" }, { status: 503 });
		}

		const { data: payment, error: paymentError } = await supabaseAdmin
			.from("payments_history")
			.select("id,company_id,status")
			.eq("payment_reference", orderId)
			.maybeSingle();

		if (paymentError || !payment) {
			return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
		}

		if (token) {
			const { data: app } = await supabaseAdmin
				.from("onboarding_applications")
				.select("company_id")
				.eq("verification_token", token)
				.maybeSingle();

			if (!app?.company_id || app.company_id !== payment.company_id) {
				return NextResponse.json({ error: "Token inválido para este pago" }, { status: 403 });
			}
		}

		if (payment.status === "paid" || payment.status === "approved") {
			return NextResponse.json({ ok: true, ref: orderId });
		}

		const paypalClient = new Client({
			clientCredentialsAuthCredentials: {
				oAuthClientId: PAYPAL_CLIENT_ID,
				oAuthClientSecret: PAYPAL_CLIENT_SECRET,
			},
			environment:
				process.env.PAYPAL_ENVIRONMENT === "production"
					? Environment.Production
					: Environment.Sandbox,
		});
		const ordersController = new OrdersController(paypalClient);
		const captureRes = await ordersController.captureOrder({ id: orderId });

		const status = captureRes.result?.status;
		if (status !== "COMPLETED" && status !== "APPROVED") {
			return NextResponse.json({ error: "Pago aún no aprobado" }, { status: 409 });
		}

		const payer = captureRes.result?.payer as {
			email_address?: string | null;
			payer_id?: string | null;
		} | undefined;
		const payerEmail = normalizeEmail(payer?.email_address);
		const payerIdHash = typeof payer?.payer_id === "string" && payer.payer_id.trim()
			? hashPaymentIdentity(payer.payer_id.trim())
			: null;

		await supabaseAdmin
			.from("payments_history")
			.update({
				status: "paid",
				payment_date: new Date().toISOString(),
				payer_email_normalized: payerEmail || null,
				paypal_payer_id_hash: payerIdHash,
			})
			.eq("id", payment.id);

		return NextResponse.json({ ok: true, ref: orderId });
	} catch (err) {
		console.error("paypal capture order error:", err);
		return NextResponse.json({ error: "Error interno" }, { status: 500 });
	}
}
