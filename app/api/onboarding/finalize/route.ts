import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { logger, createRequestContext } from "../../../../lib/logger";
import {
	activateCompanyAddonsFromApplication,
	activateCompanySubscription,
	getMonthsPaidFromPayment,
} from "../../../../lib/onboarding/billing-activation";
import {
	provisionOnboardingWelcome,
	WelcomeProvisioningError,
} from "../../../../lib/onboarding/welcome-provisioning";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "noreply@example.com";

export async function POST(req: NextRequest) {
  const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/finalize");
  if (proxied) return proxied;
  const ctx = createRequestContext("/api/onboarding/finalize", "POST");
  try {
    const ref = req.nextUrl.searchParams.get("ref") ?? (await req.json().catch(() => ({}))).ref;
    if (!ref || typeof ref !== "string") {
      return NextResponse.json({ error: "Referencia de pago faltante" }, { status: 400 });
    }

    const { data: payment, error: payError } = await supabaseAdmin
      .from("payments_history")
      .select("id,company_id,plan_id,status")
      .eq("payment_reference", ref)
      .maybeSingle();

    if (payError || !payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    const isPaid = payment.status === "paid" || payment.status === "approved";
    if (!isPaid && ref.startsWith("cs_")) {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (stripeSecret) {
        try {
          const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${ref}`, {
            headers: { Authorization: `Bearer ${stripeSecret}` },
          });
          if (stripeRes.ok) {
            const session = (await stripeRes.json()) as { payment_status?: string };
            if (session.payment_status === "paid") {
              await supabaseAdmin
                .from("payments_history")
                .update({ status: "paid" })
                .eq("payment_reference", ref);
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
    const { data: paymentUpdated } = await supabaseAdmin
      .from("payments_history")
      .select("status,months_paid")
      .eq("payment_reference", ref)
      .maybeSingle();
    const status = paymentUpdated?.status ?? payment.status;
    const monthsPaid = getMonthsPaidFromPayment(
      { months_paid: paymentUpdated?.months_paid },
      1
    );
    if (status !== "paid" && status !== "approved") {
      return NextResponse.json({ ok: true, message: "Pago aún no confirmado" });
    }

    const now = new Date();
    await activateCompanySubscription({
      supabaseAdmin,
      companyId: payment.company_id,
      monthsPaid,
      now,
    });

    const { data: app, error: appError } = await supabaseAdmin
      .from("onboarding_applications")
      .select("id,business_name,responsible_name,email,welcome_email_sent_at")
      .eq("company_id", payment.company_id)
      .eq("status", "payment_pending")
      .maybeSingle();

    if (appError || !app) {
      return NextResponse.json({ ok: true, message: "No es onboarding o ya procesado" });
    }
    if (app.welcome_email_sent_at) {
      return NextResponse.json({ ok: true, alreadySent: true });
    }

    await supabaseAdmin
      .from("companies")
      .select("id,public_slug")
      .eq("id", payment.company_id)
      .maybeSingle();

    try {
      await provisionOnboardingWelcome({
        supabaseAdmin,
        application: app,
        companyId: payment.company_id,
        resendApiKey: RESEND_API_KEY,
        resendFrom: RESEND_FROM,
      });
    } catch (error) {
      if (error instanceof WelcomeProvisioningError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    await activateCompanyAddonsFromApplication({
      supabaseAdmin,
      applicationId: app.id,
      companyId: payment.company_id,
      monthsPaid,
      now,
    });

    logger.info("Finalize completado", ctx, { companyId: payment.company_id });
    return NextResponse.json({
      ok: true,
      message: "Usuario creado y email de bienvenida enviado",
    });
  } catch (err) {
    logger.error("onboarding finalize error", ctx, { error: String(err) });
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
