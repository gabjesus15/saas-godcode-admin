import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL ??
  (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
    ? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}/checkout/success`
    : "http://localhost:3000/checkout/success");
const STRIPE_CANCEL_URL =
  process.env.STRIPE_CANCEL_URL ??
  (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
    ? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}/onboarding/pago`
    : "http://localhost:3000/onboarding/pago");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "negocio";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { token: string; months?: number };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const months = Math.min(12, Math.max(1, Number(body.months) || 1));

    if (!token) {
      return NextResponse.json({ error: "Token faltante" }, { status: 400 });
    }
    if (!STRIPE_SECRET) {
      return NextResponse.json(
        { error: "Integración de pago no configurada" },
        { status: 503 }
      );
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from("onboarding_applications")
      .select(
        "id,business_name,responsible_name,email,legal_name,logo_url,fiscal_address,billing_address,billing_rut,social_instagram,social_facebook,social_twitter,description,plan_id,country,payment_methods,currency,custom_plan_name,custom_plan_price,custom_domain"
      )
      .eq("verification_token", token)
      .eq("status", "form_completed")
      .maybeSingle();

    if (appError || !app) {
      return NextResponse.json(
        { error: "Solicitud no encontrada o incompleta" },
        { status: 404 }
      );
    }

    let plan = null;
    if (app.plan_id === "custom") {
      plan = {
        id: "custom",
        name: app.custom_plan_name ?? "Plan personalizado",
        price: Number(app.custom_plan_price ?? 0),
      };
    } else {
      if (!app.plan_id) {
        return NextResponse.json(
          { error: "Debes seleccionar un plan antes de pagar" },
          { status: 400 }
        );
      }
      const { data: planData, error: planError } = await supabaseAdmin
        .from("plans")
        .select("id,name,price")
        .eq("id", app.plan_id)
        .maybeSingle();
      if (planError || !planData) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }
      plan = planData;
    }

    const baseSlug = slugify(app.business_name);
    let publicSlug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("public_slug", publicSlug)
        .maybeSingle();
      if (!existing) break;
      suffix += 1;
      publicSlug = `${baseSlug}-${suffix}`;
    }

    const companyPayload = {
      name: app.business_name,
      legal_rut: app.billing_rut ?? null,
      email: app.email,
      phone: null,
      address: app.fiscal_address ?? null,
      public_slug: publicSlug,
      plan_id: app.plan_id,
      subscription_status: "trial",
      custom_domain: app.custom_domain ?? null,
      custom_plan_name: app.custom_plan_name ?? null,
      custom_plan_price: app.custom_plan_price ?? null,
      theme_config: {
        displayName: app.business_name,
        logoUrl: app.logo_url ?? null,
        primaryColor: "#111827",
        secondaryColor: "#111827",
        roleNavPermissions: {
          owner: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings", "company"],
          admin: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings", "company"],
          ceo: ["orders", "caja", "analytics", "categories", "products", "inventory", "clients", "settings"],
          cashier: ["orders", "caja"],
        },
      },
    };

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert(companyPayload)
      .select("id")
      .single();

    if (companyError || !company) {
      if (companyError?.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una empresa con datos similares" },
          { status: 409 }
        );
      }
      console.error("onboarding checkout company insert:", companyError);
      return NextResponse.json(
        { error: "Error al crear la empresa" },
        { status: 500 }
      );
    }

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .insert({
        company_id: company.id,
        name: "Principal",
        slug: "principal",
        address: app.fiscal_address ?? null,
        is_active: true,
      })
      .select("id")
      .single();

    if (branchError && !branch) {
      console.error("onboarding checkout branch insert:", branchError);
    }

    await supabaseAdmin.from("business_info").insert({
      company_id: company.id,
      name: app.business_name,
      address: app.fiscal_address ?? null,
      instagram: app.social_instagram ?? null,
      schedule: null,
    }).then(() => {});

    await supabaseAdmin
      .from("onboarding_applications")
      .update({
        company_id: company.id,
        status: "payment_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    // Lógica de métodos de pago por país
    if (app.country === "Venezuela") {
      // Aquí podrías devolver info para mostrar opciones de Pago Móvil, Zelle, Transferencia, Stripe
      // Por ahora, solo Stripe está implementado, pero puedes extenderlo
      // Ejemplo: return NextResponse.json({ ok: true, paymentOptions: ["Pago Móvil", "Zelle", "Transferencia", "Stripe"], ... });
      // Continúa con Stripe por defecto
    }

    const amount = Math.round(Number(plan.price ?? 0) * months * 100);
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${STRIPE_SUCCESS_URL}?ref={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", STRIPE_CANCEL_URL);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan.name ?? "Plan");
    params.append("line_items[0][price_data][unit_amount]", amount.toString());
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[company_id]", company.id);
    params.append("metadata[plan_id]", app.plan_id);
    params.append("metadata[months]", months.toString());
    params.append("metadata[onboarding_application_id]", app.id);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const text = await stripeRes.text();
      console.error("stripe checkout:", text);
      return NextResponse.json(
        { error: "Error al crear sesión de pago" },
        { status: 502 }
      );
    }

    const session = (await stripeRes.json()) as { id?: string; url?: string };

    await supabaseAdmin.from("payments_history").insert({
      company_id: company.id,
      plan_id: app.plan_id,
      amount_paid: Number(plan.price ?? 0) * months,
      payment_method: "stripe",
      payment_reference: session.id ?? "stripe-session",
      payment_date: new Date().toISOString(),
      status: "pending",
      months_paid: months,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
      country: app.country,
      paymentOptions: Array.isArray(app.payment_methods) && app.payment_methods.length > 0 ? app.payment_methods : (app.country === "Venezuela" ? ["Pago Móvil", "Zelle", "Transferencia", "Stripe"] : ["Stripe"]),
      currency: app.currency || "USD",
    });
  } catch (err) {
    console.error("onboarding checkout error:", err);
    return NextResponse.json(
      { error: "Error interno. Intenta más tarde." },
      { status: 500 }
    );
  }
}
