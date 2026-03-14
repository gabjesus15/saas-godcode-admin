import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

import { validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";
import { sendOnboardingEmail } from "../../../../../lib/onboarding/emails";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { autoRefreshToken: false, persistSession: false } }
);

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "noreply@example.com";

/** POST { "payment_id": "uuid" } o { "payment_reference": "manual-..." }
 * Valida un pago manual: status → paid, company → active + subscription_ends_at, y si es onboarding pendiente crea usuario y envía bienvenida.
 */
export async function POST(req: NextRequest) {
	const permission = await validateAdminRolesOnServer(["super_admin"]);
	if (!permission.ok) {
		return NextResponse.json({ error: permission.error ?? "No autorizado" }, { status: permission.status ?? 403 });
	}

	try {
		const body = (await req.json().catch(() => ({}))) as { payment_id?: string; payment_reference?: string };
		const paymentId = typeof body.payment_id === "string" ? body.payment_id.trim() : "";
		const paymentRef = typeof body.payment_reference === "string" ? body.payment_reference.trim() : "";

		if (!paymentId && !paymentRef) {
			return NextResponse.json({ error: "Indica payment_id o payment_reference" }, { status: 400 });
		}

		const query = supabaseAdmin
			.from("payments_history")
			.select("id,company_id,plan_id,status,months_paid,payment_reference")
			.limit(1);
		if (paymentId) query.eq("id", paymentId);
		else query.eq("payment_reference", paymentRef);

		const { data: payment, error: payError } = await query.maybeSingle();

		if (payError || !payment) {
			return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
		}
		if (payment.status !== "pending_validation") {
			return NextResponse.json(
				{ error: "Este pago ya fue validado o no está pendiente de validación" },
				{ status: 400 }
			);
		}

		const monthsPaid = Math.max(1, Number(payment.months_paid ?? 1));
		const now = new Date();
		const endsAt = new Date(now);
		endsAt.setDate(endsAt.getDate() + monthsPaid * 30);

		await supabaseAdmin
			.from("payments_history")
			.update({ status: "paid", payment_date: now.toISOString() })
			.eq("id", payment.id);

		await supabaseAdmin
			.from("companies")
			.update({
				subscription_status: "active",
				subscription_ends_at: endsAt.toISOString(),
				updated_at: now.toISOString(),
			})
			.eq("id", payment.company_id);

		const { data: app } = await supabaseAdmin
			.from("onboarding_applications")
			.select("id,business_name,responsible_name,email,welcome_email_sent_at")
			.eq("company_id", payment.company_id)
			.eq("status", "payment_pending")
			.maybeSingle();

		let welcomeSent = false;
		if (app && !app.welcome_email_sent_at) {
			const tempPassword = randomBytes(16).toString("hex");
			const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email: app.email,
				password: tempPassword,
				email_confirm: true,
			});

			if (!authError && authUser?.user?.id) {
				await supabaseAdmin.from("users").insert({
					email: app.email,
					role: "ceo",
					company_id: payment.company_id,
					branch_id: null,
					auth_user_id: authUser.user.id,
					auth_id: authUser.user.id,
				}).then(() => {});

				const linkResult = await supabaseAdmin.auth.admin.generateLink({
					type: "recovery",
					email: app.email,
				});
				const magicLink = (linkResult.data as { properties?: { action_link?: string } })?.properties?.action_link;
				const fallbackUrl = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
					? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
					: "http://localhost:3000";
				const panelUrl = magicLink || fallbackUrl;

				await sendOnboardingEmail({
					type: "welcome",
					to: app.email,
					from: RESEND_FROM,
					apiKey: RESEND_API_KEY,
					responsibleName: app.responsible_name,
					businessName: app.business_name,
					panelUrl,
				});

				await supabaseAdmin
					.from("onboarding_applications")
					.update({
						status: "active",
						welcome_email_sent_at: now.toISOString(),
						updated_at: now.toISOString(),
					})
					.eq("id", app.id);
				welcomeSent = true;
			}
		}

		if (app?.id) {
			const { data: appAddons } = await supabaseAdmin
				.from("onboarding_application_addons")
				.select("addon_id,quantity,price_snapshot")
				.eq("application_id", app.id);
			if (Array.isArray(appAddons) && appAddons.length > 0) {
				const addonIds = [...new Set(appAddons.map((a) => a.addon_id))];
				const { data: addonsMeta } = await supabaseAdmin.from("addons").select("id,type").in("id", addonIds);
				const typeById = new Map((addonsMeta ?? []).map((a) => [a.id, a.type]));
				const expiresBase = new Date(now);
				expiresBase.setDate(expiresBase.getDate() + monthsPaid * 30);
				for (const row of appAddons) {
					const type = typeById.get(row.addon_id) ?? "one_time";
					await supabaseAdmin.from("company_addons").upsert(
						{
							company_id: payment.company_id,
							addon_id: row.addon_id,
							status: "active",
							price_paid: row.price_snapshot != null ? Number(row.price_snapshot) : null,
							expires_at: type === "monthly" ? expiresBase.toISOString() : null,
							updated_at: now.toISOString(),
						},
						{ onConflict: "company_id,addon_id" }
					);
				}
			}
		}

		return NextResponse.json({
			ok: true,
			message: "Pago validado. Suscripción activada.",
			welcome_email_sent: welcomeSent,
		});
	} catch (err) {
		console.error("validate payment error:", err);
		return NextResponse.json({ error: "Error interno" }, { status: 500 });
	}
}
