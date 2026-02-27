import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";
  const corsOrigin = Deno.env.get("CORS_ORIGIN") ?? origin;
  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 204, headers: jsonHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const successUrl = Deno.env.get("STRIPE_SUCCESS_URL");
    const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (!stripeSecret || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe configuration" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const body = await req.json().catch(() => null);
    const companyId = body?.company_id as string | undefined;
    const planId = body?.plan_id as string | undefined;
    const months = Number(body?.months ?? 1);

    if (!companyId || !planId || Number.isNaN(months) || months <= 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : "";

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id,name,price")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    if (plan.name?.toLowerCase().includes("dev")) {
      return new Response(
        JSON.stringify({ error: "Internal plan cannot be billed" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const amount = Math.round(Number(plan.price ?? 0) * months * 100);
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan.name ?? "Plan SaaS");
    params.append("line_items[0][price_data][unit_amount]", amount.toString());
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[company_id]", companyId);
    params.append("metadata[plan_id]", planId);
    params.append("metadata[months]", months.toString());

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const text = await stripeRes.text();
      return new Response(JSON.stringify({ error: text }), {
        status: 502,
        headers: jsonHeaders,
      });
    }

    const session = await stripeRes.json();

    await supabase.from("payments_history").insert({
      company_id: companyId,
      plan_id: planId,
      amount_paid: Number(plan.price ?? 0) * months,
      payment_method: "stripe",
      payment_reference: session.id ?? "stripe-session",
      payment_date: new Date().toISOString(),
      status: "pending",
      months_paid: months,
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
