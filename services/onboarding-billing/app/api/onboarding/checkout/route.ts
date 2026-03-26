import { NextRequest, NextResponse } from "next/server";
import {
	Client,
	Environment,
	OrdersController,
	CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
	isManualMethod,
	resolveCheckoutPlan,
	calculateAddonsTotalUsd,
	provisionCompanyFromApplication,
	recordPayment,
	getManualMethodConfig,
} from "../../../../lib/onboarding/checkout-service";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_SUCCESS_URL =
	process.env.STRIPE_SUCCESS_URL ??
	(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
		? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}/checkout/success`
		: "http://localhost:3001/checkout/success");
const STRIPE_CANCEL_URL =
	process.env.STRIPE_CANCEL_URL ??
	(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
		? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}/onboarding/pago`
		: "http://localhost:3001/onboarding/pago");

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as { token: string; months?: number };
		const token = typeof body.token === "string" ? body.token.trim() : "";
		const months = Math.min(12, Math.max(1, Number(body.months) || 1));

		if (!token) {
			return NextResponse.json({ error: "Token faltante" }, { status: 400 });
		}

		const { data: app, error: appError } = await supabaseAdmin
			.from("onboarding_applications")
			.select(
				"id,business_name,responsible_name,email,legal_name,logo_url,fiscal_address,billing_address,billing_rut,social_instagram,social_facebook,social_twitter,description,plan_id,country,payment_methods,currency,custom_plan_name,custom_plan_price,custom_domain,company_id,subscription_payment_method"
			)
			.eq("verification_token", token)
			.in("status", ["form_completed", "payment_pending"])
			.maybeSingle();

		if (appError || !app) {
			return NextResponse.json({ error: "Solicitud no encontrada o incompleta" }, { status: 404 });
		}

		const subscriptionMethod = (app.subscription_payment_method ?? "").trim().toLowerCase();
		const isPayPal = subscriptionMethod === "paypal";
		const paypalClientId = process.env.PAYPAL_CLIENT_ID ?? "";
		const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";

		if (!STRIPE_SECRET && !isPayPal) {
			return NextResponse.json({ error: "Integración de pago no configurada" }, { status: 503 });
		}
		if (isPayPal && (!paypalClientId || !paypalClientSecret)) {
			return NextResponse.json({ error: "PayPal no configurado (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)" }, { status: 503 });
		}

		const isManualPayment = isManualMethod(subscriptionMethod);

		const planResult = await resolveCheckoutPlan(supabaseAdmin, app);
		if (!planResult.plan) {
			return NextResponse.json({ error: planResult.error }, { status: planResult.status });
		}
		const plan = planResult.plan;

		const addonsTotalUsd = await calculateAddonsTotalUsd(supabaseAdmin, app.id, months);

		const companyResult = await provisionCompanyFromApplication(supabaseAdmin, app, isManualPayment);
		if (!companyResult.ok) {
			return NextResponse.json({ error: companyResult.error }, { status: companyResult.status });
		}
		const company = companyResult.company;

		const amountUsd = Number(plan.price ?? 0) * months + addonsTotalUsd;

		if (isPayPal) {
			return handlePayPalCheckout({
				app, plan, company, amountUsd, months, token,
				paypalClientId, paypalClientSecret,
			});
		}

		if (isManualPayment) {
			return handleManualCheckout({
				app, company, amountUsd, months, subscriptionMethod,
			});
		}

		return handleStripeCheckout({
			app, plan, company, amountUsd, addonsTotalUsd, months,
		});
	} catch (err) {
		console.error("onboarding checkout error:", err);
		return NextResponse.json({ error: "Error interno. Intenta más tarde." }, { status: 500 });
	}
}

async function handlePayPalCheckout(params: {
	app: { id: string; country?: string | null; payment_methods?: string[] | null; currency?: string | null; plan_id: string };
	plan: { name: string };
	company: { id: string };
	amountUsd: number;
	months: number;
	token: string;
	paypalClientId: string;
	paypalClientSecret: string;
}) {
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
		(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
			? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
			: "http://localhost:3001");
	const returnUrl = `${baseUrl}/api/onboarding/paypal-capture`;
	const cancelUrl = `${baseUrl}/onboarding/pago?token=${encodeURIComponent(params.token)}`;

	const paypalClient = new Client({
		clientCredentialsAuthCredentials: {
			oAuthClientId: params.paypalClientId,
			oAuthClientSecret: params.paypalClientSecret,
		},
		environment:
			process.env.PAYPAL_ENVIRONMENT === "production"
				? Environment.Production
				: Environment.Sandbox,
	});
	const ordersController = new OrdersController(paypalClient);

	const createRes = await ordersController.createOrder({
		body: {
			intent: CheckoutPaymentIntent.Capture,
			purchaseUnits: [
				{
					amount: { currencyCode: "USD", value: params.amountUsd.toFixed(2) },
					description: params.plan.name ?? "Plan",
				},
			],
			applicationContext: { returnUrl, cancelUrl },
		},
	});

	const order = createRes.result;
	const orderId = order?.id;
	const approveLink = order?.links?.find((l) => l.rel === "approve")?.href;

	if (!orderId || !approveLink) {
		console.error("paypal create order:", createRes);
		return NextResponse.json({ error: "Error al crear la orden de PayPal" }, { status: 502 });
	}

	await recordPayment(supabaseAdmin, {
		companyId: params.company.id,
		planId: params.app.plan_id,
		amountPaid: params.amountUsd,
		paymentMethod: "paypal",
		paymentMethodSlug: "paypal",
		paymentReference: orderId,
		status: "pending",
		monthsPaid: params.months,
	});

	return NextResponse.json({
		ok: true,
		url: approveLink,
		sessionId: orderId,
		country: params.app.country,
		paymentOptions:
			Array.isArray(params.app.payment_methods) && params.app.payment_methods.length > 0
				? params.app.payment_methods
				: ["PayPal", "Stripe"],
		currency: params.app.currency || "USD",
	});
}

async function handleManualCheckout(params: {
	app: { id: string; country?: string | null; currency?: string | null; plan_id: string; subscription_payment_method?: string | null };
	company: { id: string };
	amountUsd: number;
	months: number;
	subscriptionMethod: string;
}) {
	const paymentRef = `manual-${params.app.id}-${Date.now()}`;

	const payResult = await recordPayment(supabaseAdmin, {
		companyId: params.company.id,
		planId: params.app.plan_id,
		amountPaid: params.amountUsd,
		paymentMethod: params.subscriptionMethod,
		paymentMethodSlug: params.subscriptionMethod,
		paymentReference: paymentRef,
		status: "pending_validation",
		monthsPaid: params.months,
	});

	if (payResult.error) {
		return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 });
	}

	const methodConfig = await getManualMethodConfig(supabaseAdmin, params.subscriptionMethod);

	return NextResponse.json({
		ok: true,
		manual: true,
		company_id: params.company.id,
		payment_id: payResult.id,
		payment_reference: paymentRef,
		amount_usd: params.amountUsd,
		months: params.months,
		currency: params.app.currency || "USD",
		country: params.app.country ?? null,
		method_slug: params.subscriptionMethod,
		method_config: methodConfig,
	});
}

async function handleStripeCheckout(params: {
	app: { id: string; country?: string | null; payment_methods?: string[] | null; currency?: string | null; plan_id: string };
	plan: { name: string; price: number };
	company: { id: string };
	amountUsd: number;
	addonsTotalUsd: number;
	months: number;
}) {
	if (!STRIPE_SECRET) {
		return NextResponse.json({ error: "Integración de pago con tarjeta no configurada" }, { status: 503 });
	}

	const planAmountCents = Math.round(Number(params.plan.price ?? 0) * params.months * 100);
	const stripeParams = new URLSearchParams();
	stripeParams.append("mode", "payment");
	stripeParams.append("success_url", `${STRIPE_SUCCESS_URL}?ref={CHECKOUT_SESSION_ID}`);
	stripeParams.append("cancel_url", STRIPE_CANCEL_URL);
	stripeParams.append("line_items[0][price_data][currency]", "usd");
	stripeParams.append("line_items[0][price_data][product_data][name]", params.plan.name ?? "Plan");
	stripeParams.append("line_items[0][price_data][unit_amount]", planAmountCents.toString());
	stripeParams.append("line_items[0][quantity]", "1");
	if (params.addonsTotalUsd > 0) {
		stripeParams.append("line_items[1][price_data][currency]", "usd");
		stripeParams.append("line_items[1][price_data][product_data][name]", "Servicios extra");
		stripeParams.append("line_items[1][price_data][unit_amount]", Math.round(params.addonsTotalUsd * 100).toString());
		stripeParams.append("line_items[1][quantity]", "1");
	}
	stripeParams.append("metadata[company_id]", params.company.id);
	stripeParams.append("metadata[plan_id]", params.app.plan_id);
	stripeParams.append("metadata[months]", params.months.toString());
	stripeParams.append("metadata[onboarding_application_id]", params.app.id);

	const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${STRIPE_SECRET}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: stripeParams.toString(),
	});

	if (!stripeRes.ok) {
		const text = await stripeRes.text();
		console.error("stripe checkout:", text);
		return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 502 });
	}

	const session = (await stripeRes.json()) as { id?: string; url?: string };

	await recordPayment(supabaseAdmin, {
		companyId: params.company.id,
		planId: params.app.plan_id,
		amountPaid: params.amountUsd,
		paymentMethod: "stripe",
		paymentMethodSlug: "stripe",
		paymentReference: session.id ?? "stripe-session",
		status: "pending",
		monthsPaid: params.months,
	});

	return NextResponse.json({
		ok: true,
		url: session.url,
		sessionId: session.id,
		country: params.app.country,
		paymentOptions: Array.isArray(params.app.payment_methods) && params.app.payment_methods.length > 0
			? params.app.payment_methods
			: (params.app.country === "Venezuela" ? ["Pago Móvil", "Zelle", "Transferencia", "Stripe"] : ["Stripe"]),
		currency: params.app.currency || "USD",
	});
}
