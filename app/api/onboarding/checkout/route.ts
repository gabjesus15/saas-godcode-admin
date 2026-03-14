import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
	Client,
	Environment,
	OrdersController,
	CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";

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
    const paypalClientId = process.env.PAYPAL_CLIENT_ID ?? "";
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
    const isPayPal = subscriptionMethod === "paypal";

    if (!STRIPE_SECRET && !isPayPal) {
      return NextResponse.json(
        { error: "Integración de pago no configurada" },
        { status: 503 }
      );
    }
    if (isPayPal && (!paypalClientId || !paypalClientSecret)) {
      return NextResponse.json(
        { error: "PayPal no configurado (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)" },
        { status: 503 }
      );
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
      return NextResponse.json(
        { error: "Solicitud no encontrada o incompleta" },
        { status: 404 }
      );
    }

    const manualMethodSlugs = ["pago_movil", "zelle", "transferencia"];
    const subscriptionMethod = (app.subscription_payment_method ?? "").trim().toLowerCase();
    const isManualPayment = manualMethodSlugs.includes(subscriptionMethod);

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

    const { data: applicationAddonsRows } = await supabaseAdmin
      .from("onboarding_application_addons")
      .select("addon_id,quantity,price_snapshot")
      .eq("application_id", app.id);
    const applicationAddons = applicationAddonsRows ?? [];
    let addonsTotalUsd = 0;
    if (applicationAddons.length > 0) {
      const addonIds = [...new Set(applicationAddons.map((a) => a.addon_id))];
      const { data: addonsMeta } = await supabaseAdmin
        .from("addons")
        .select("id,type")
        .in("id", addonIds);
      const typeById = new Map((addonsMeta ?? []).map((a) => [a.id, a.type]));
      for (const row of applicationAddons) {
        const price = Number(row.price_snapshot ?? 0);
        const qty = Math.max(1, Number(row.quantity) || 1);
        const type = typeById.get(row.addon_id) ?? "one_time";
        if (type === "monthly") addonsTotalUsd += price * qty * months;
        else addonsTotalUsd += price * qty;
      }
    }

    let company: { id: string } | null = null;

    if (app.company_id) {
      const { data: existing } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("id", app.company_id)
        .maybeSingle();
      company = existing;
    }

    if (!company) {
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
        subscription_status: isManualPayment ? "payment_pending" : "trial",
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

      const { data: inserted, error: companyError } = await supabaseAdmin
        .from("companies")
        .insert(companyPayload)
        .select("id")
        .single();

      if (companyError || !inserted) {
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
      company = inserted;

      const { error: branchError } = await supabaseAdmin.from("branches").insert({
        company_id: company.id,
        name: "Principal",
        slug: "principal",
        address: app.fiscal_address ?? null,
        is_active: true,
      });
      if (branchError) console.error("onboarding checkout branch insert:", branchError);

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
    }

    const amountUsd = Number(plan.price ?? 0) * months + addonsTotalUsd;

    if (isPayPal) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
          ? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
          : "http://localhost:3000");
      const returnUrl = `${baseUrl}/api/onboarding/paypal-capture`;
      const cancelUrl = `${baseUrl}/onboarding/pago?token=${encodeURIComponent(token)}`;

      const paypalClient = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: paypalClientId,
          oAuthClientSecret: paypalClientSecret,
        },
        environment:
          process.env.PAYPAL_ENVIRONMENT === "production"
            ? Environment.Production
            : Environment.Sandbox,
      });
      const ordersController = new OrdersController(paypalClient);

      const orderValue = amountUsd.toFixed(2);
      const createRes = await ordersController.createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              amount: {
                currencyCode: "USD",
                value: orderValue,
              },
              description: plan.name ?? "Plan",
            },
          ],
          applicationContext: {
            returnUrl,
            cancelUrl,
          },
        },
      });

      const order = createRes.result;
      const orderId = order?.id;
      const approveLink = order?.links?.find((l) => l.rel === "approve")?.href;

      if (!orderId || !approveLink) {
        console.error("paypal create order:", createRes);
        return NextResponse.json(
          { error: "Error al crear la orden de PayPal" },
          { status: 502 }
        );
      }

      await supabaseAdmin.from("payments_history").insert({
        company_id: company.id,
        plan_id: app.plan_id,
        amount_paid: amountUsd,
        payment_method: "paypal",
        payment_method_slug: "paypal",
        payment_reference: orderId,
        payment_date: new Date().toISOString(),
        status: "pending",
        months_paid: months,
      });

      return NextResponse.json({
        ok: true,
        url: approveLink,
        sessionId: orderId,
        country: app.country,
        paymentOptions:
          Array.isArray(app.payment_methods) && app.payment_methods.length > 0
            ? app.payment_methods
            : ["PayPal", "Stripe"],
        currency: app.currency || "USD",
      });
    }

    if (isManualPayment) {
      const paymentRef = `manual-${app.id}-${Date.now()}`;
      const { data: paymentRow, error: payErr } = await supabaseAdmin
        .from("payments_history")
        .insert({
          company_id: company.id,
          plan_id: app.plan_id,
          amount_paid: amountUsd,
          payment_method: subscriptionMethod,
          payment_method_slug: subscriptionMethod,
          payment_reference: paymentRef,
          payment_date: new Date().toISOString(),
          status: "pending_validation",
          months_paid: months,
        })
        .select("id")
        .single();

      if (payErr) {
        console.error("onboarding checkout manual payment insert:", payErr);
        return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 });
      }

      let methodConfig: Record<string, string> = {};
      if (subscriptionMethod) {
        const { data: methodRow } = await supabaseAdmin
          .from("plan_payment_methods")
          .select("id")
          .eq("slug", subscriptionMethod)
          .maybeSingle();
        if (methodRow) {
          const { data: configRows } = await supabaseAdmin
            .from("plan_payment_method_config")
            .select("key,value")
            .eq("method_id", methodRow.id);
          for (const row of configRows ?? []) {
            if (row.key) methodConfig[row.key] = row.value ?? "";
          }
        }
      }

      return NextResponse.json({
        ok: true,
        manual: true,
        company_id: company.id,
        payment_id: paymentRow?.id,
        payment_reference: paymentRef,
        amount_usd: amountUsd,
        months,
        currency: app.currency || "USD",
        country: app.country ?? null,
        method_slug: subscriptionMethod,
        method_config: methodConfig,
      });
    }

    if (!STRIPE_SECRET) {
      return NextResponse.json(
        { error: "Integración de pago con tarjeta no configurada" },
        { status: 503 }
      );
    }

    const planAmountUsd = Number(plan.price ?? 0) * months;
    const planAmountCents = Math.round(planAmountUsd * 100);
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${STRIPE_SUCCESS_URL}?ref={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", STRIPE_CANCEL_URL);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan.name ?? "Plan");
    params.append("line_items[0][price_data][unit_amount]", planAmountCents.toString());
    params.append("line_items[0][quantity]", "1");
    if (addonsTotalUsd > 0) {
      params.append("line_items[1][price_data][currency]", "usd");
      params.append("line_items[1][price_data][product_data][name]", "Servicios extra");
      params.append("line_items[1][price_data][unit_amount]", Math.round(addonsTotalUsd * 100).toString());
      params.append("line_items[1][quantity]", "1");
    }
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
      amount_paid: amountUsd,
      payment_method: "stripe",
      payment_method_slug: "stripe",
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
