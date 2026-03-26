import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { logger, createRequestContext } from "../../../../../lib/logger";
import { validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";
import {
	activateCompanyAddonsFromApplication,
	activateCompanySubscription,
	getMonthsPaidFromPayment,
} from "../../../../../lib/onboarding/billing-activation";
import { provisionOnboardingWelcome } from "../../../../../lib/onboarding/welcome-provisioning";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "noreply@example.com";

/** POST { "payment_id": "uuid" } o { "payment_reference": "manual-..." }
 * Valida un pago manual: status → paid, company → active + subscription_ends_at, y si es onboarding pendiente crea usuario y envía bienvenida.
 */
export async function POST(req: NextRequest) {
	const ctx = createRequestContext("/api/super-admin/payments/validate", "POST");
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

		const monthsPaid = getMonthsPaidFromPayment({ months_paid: payment.months_paid }, 1);
		const now = new Date();

		await supabaseAdmin
			.from("payments_history")
			.update({ status: "paid", payment_date: now.toISOString() })
			.eq("id", payment.id);

		await activateCompanySubscription({
			supabaseAdmin,
			companyId: payment.company_id,
			monthsPaid,
			now,
		});

		const { data: app } = await supabaseAdmin
			.from("onboarding_applications")
			.select("id,business_name,responsible_name,email,welcome_email_sent_at")
			.eq("company_id", payment.company_id)
			.eq("status", "payment_pending")
			.maybeSingle();

		let welcomeSent = false;
		if (app && !app.welcome_email_sent_at) {
			try {
				await provisionOnboardingWelcome({
					supabaseAdmin,
					application: app,
					companyId: payment.company_id,
					resendApiKey: RESEND_API_KEY,
					resendFrom: RESEND_FROM,
				});
				welcomeSent = true;
			} catch {
				// Se conserva el comportamiento previo: el pago se valida aunque falle el provisioning de bienvenida.
			}
		}

		if (app?.id) {
			await activateCompanyAddonsFromApplication({
				supabaseAdmin,
				applicationId: app.id,
				companyId: payment.company_id,
				monthsPaid,
				now,
			});
		}

		logger.info("Pago validado", ctx, { companyId: payment.company_id, welcomeSent });
		return NextResponse.json({
			ok: true,
			message: "Pago validado. Suscripción activada.",
			welcome_email_sent: welcomeSent,
		});
	} catch (err) {
		logger.error("validate payment error", ctx, { error: String(err) });
		return NextResponse.json({ error: "Error interno" }, { status: 500 });
	}
}
