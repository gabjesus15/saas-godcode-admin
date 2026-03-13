import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

import { sendOnboardingEmail } from "../../../../lib/onboarding/emails";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "noreply@example.com";

export async function POST(req: NextRequest) {
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
      .select("status")
      .eq("payment_reference", ref)
      .maybeSingle();
    const status = paymentUpdated?.status ?? payment.status;
    if (status !== "paid" && status !== "approved") {
      return NextResponse.json({ ok: true, message: "Pago aún no confirmado" });
    }

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

    const tempPassword = randomBytes(16).toString("hex");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Error al crear usuario" },
        { status: 400 }
      );
    }

    const authUserId = authUser.user?.id;
    if (!authUserId) {
      return NextResponse.json({ error: "Usuario de auth no creado" }, { status: 500 });
    }

    const { error: userInsertError } = await supabaseAdmin.from("users").insert({
      email: app.email,
      role: "ceo",
      company_id: payment.company_id,
      branch_id: null,
      auth_user_id: authUserId,
      auth_id: authUserId,
    });

    if (userInsertError) {
      return NextResponse.json(
        { error: userInsertError.message || "Error al vincular usuario" },
        { status: 500 }
      );
    }

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
        welcome_email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    return NextResponse.json({
      ok: true,
      message: "Usuario creado y email de bienvenida enviado",
    });
  } catch (err) {
    console.error("onboarding finalize error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
