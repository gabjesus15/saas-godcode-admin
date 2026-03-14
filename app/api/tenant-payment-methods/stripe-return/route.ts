import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";

/** GET: vuelta desde Stripe Connect onboarding; verifica cuenta y redirige al admin del tenant */
export async function GET(req: NextRequest) {
	try {
		const companyId = req.nextUrl.searchParams.get("company_id");
		if (!companyId) {
			return NextResponse.redirect(
				new URL("/", process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin)
			);
		}

		const { data: company } = await supabaseAdmin
			.from("companies")
			.select("id,public_slug")
			.eq("id", companyId)
			.maybeSingle();

		const slug = company?.public_slug ?? "";
		const origin =
			req.nextUrl.origin ||
			process.env.NEXT_PUBLIC_APP_URL ||
			"http://localhost:3000";
		const adminPath = slug ? `/${slug}/admin#payment_methods` : "/admin#payment_methods";
		const fallbackRedirect = new URL(adminPath, origin);

		const { data: accountRow } = await supabaseAdmin
			.from("tenant_connected_accounts")
			.select("id,external_id,status")
			.eq("company_id", companyId)
			.eq("provider", "stripe")
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!accountRow?.external_id) {
			return NextResponse.redirect(fallbackRedirect);
		}

		if (STRIPE_SECRET) {
			const stripe = new Stripe(STRIPE_SECRET, {
				apiVersion: "2025-02-24.acacia",
			});
			try {
				const acc = await stripe.accounts.retrieve(accountRow.external_id);
				const detailsSubmitted = acc.details_submitted === true;
				const displayName =
					(acc.business_profile?.name ?? acc.email ?? null) || null;

				await supabaseAdmin
					.from("tenant_connected_accounts")
					.update({
						status: detailsSubmitted ? "active" : "pending",
						display_name: displayName,
						updated_at: new Date().toISOString(),
					})
					.eq("id", accountRow.id);
			} catch {
				// Si Stripe falla, igual redirigimos al admin
			}
		}

		return NextResponse.redirect(fallbackRedirect);
	} catch (err) {
		console.error("stripe-return:", err);
		const origin =
			process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		return NextResponse.redirect(new URL("/", origin));
	}
}
