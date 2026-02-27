import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/functions-js";

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
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const notificationUrl = Deno.env.get("MP_NOTIFICATION_URL");
    const successUrl = Deno.env.get("MP_SUCCESS_URL");
    const failureUrl = Deno.env.get("MP_FAILURE_URL");
    const pendingUrl = Deno.env.get("MP_PENDING_URL");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: "Missing MercadoPago credentials" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const body = await req.json().catch(() => null);
    const companyId = body?.company_id as string | undefined;
    const planId = body?.plan_id as string | undefined;
    const months = Number(body?.months ?? 1);

    if (!companyId || !planId || Number.isNaN(months) || months <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: jsonHeaders }
      );
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

    const amount = Number(plan.price ?? 0) * months;

    const preferencePayload = {
      items: [
        {
          title: `Plan ${plan.name ?? "SaaS"} - ${months} mes(es)`,
          quantity: 1,
          currency_id: "USD",
          unit_price: amount,
        },
      ],
      metadata: {
        company_id: companyId,
        plan_id: planId,
        months,
      },
      notification_url: notificationUrl ?? undefined,
      back_urls: {
        success: successUrl ?? undefined,
        failure: failureUrl ?? undefined,
        pending: pendingUrl ?? undefined,
      },
      auto_return: "approved",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpRes.ok) {
      const text = await mpRes.text();
      return new Response(JSON.stringify({ error: text }), {
        status: 502,
        headers: jsonHeaders,
      });
    }

    const preference = await mpRes.json();

    await supabase.from("payments_history").insert({
      company_id: companyId,
      plan_id: planId,
      amount_paid: amount,
      payment_method: "mercadopago",
      payment_reference: preference.id ?? "mp-preference",
      payment_date: new Date().toISOString(),
      status: "pending",
      months_paid: months,
    });

    return new Response(
      JSON.stringify({
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
