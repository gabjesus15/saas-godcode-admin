import { NextRequest, NextResponse } from "next/server";
import {
	Client,
	Environment,
	OrdersController,
} from "@paypal/paypal-server-sdk";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

export async function GET(req: NextRequest) {
	try {
		const token = req.nextUrl.searchParams.get("token");
		if (!token) {
			return NextResponse.redirect(
				new URL("/onboarding/pago?error=missing_token", req.url)
			);
		}

		if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
			return NextResponse.redirect(
				new URL("/onboarding/pago?error=paypal_not_configured", req.url)
			);
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

		const captureRes = await ordersController.captureOrder({
			id: token,
		});

		const status = captureRes.result?.status;
		if (status === "COMPLETED" || status === "APPROVED") {
			await supabaseAdmin
				.from("payments_history")
				.update({ status: "paid", payment_date: new Date().toISOString() })
				.eq("payment_reference", token);
		}

		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
			(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
				? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
				: "http://localhost:3001");
		const successUrl = `${baseUrl}/checkout/success?ref=${encodeURIComponent(token)}`;
		return NextResponse.redirect(successUrl);
	} catch (err) {
		console.error("paypal capture error:", err);
		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
			(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
				? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
				: "http://localhost:3001");
		return NextResponse.redirect(
			new URL("/onboarding/pago?error=paypal_capture_failed", baseUrl)
		);
	}
}
