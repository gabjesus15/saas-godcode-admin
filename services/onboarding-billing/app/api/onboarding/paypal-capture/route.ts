import { NextRequest, NextResponse } from "next/server";
import {
	Client,
	Environment,
	OrdersController,
} from "@paypal/paypal-server-sdk";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
	getBookingContactDate,
	queueBookingReminder,
	sendPaymentValidatedNotice,
} from "../../../../lib/onboarding/booking-notifications";
import { hashPaymentIdentity, normalizeEmail } from "../../../../lib/onboarding/trial-eligibility";

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
				.eq("payment_reference", token);

			const { data: payment } = await supabaseAdmin
				.from("payments_history")
				.select("company_id")
				.eq("payment_reference", token)
				.maybeSingle();

			if (payment?.company_id) {
				const { data: application } = await supabaseAdmin
					.from("onboarding_applications")
					.select("business_name,responsible_name,email,status")
					.eq("company_id", payment.company_id)
					.eq("status", "payment_pending")
					.maybeSingle();

				if (application) {
					const preferredContactDate = getBookingContactDate();
					const booking = await queueBookingReminder({
						supabaseAdmin,
						companyId: payment.company_id,
						businessName: application.business_name,
						requesterEmail: application.email,
						scheduledFor: preferredContactDate,
					});
					await sendPaymentValidatedNotice({
						supabaseAdmin,
						companyId: payment.company_id,
						businessName: application.business_name,
						responsibleName: application.responsible_name ?? "",
						recipientEmail: application.email,
						contactDate: booking.scheduledFor,
					});
				}
			}
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
