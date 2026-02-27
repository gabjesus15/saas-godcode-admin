import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

  if (!supabaseUrl || !serviceRoleKey || !mpAccessToken) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const id = url.searchParams.get("id") || url.searchParams.get("data.id");
  const body = req.method === "POST" ? await req.json().catch(() => null) : null;
  const eventType = body?.type || topic;
  const eventId = body?.data?.id || id;

  if (eventType !== "payment" || !eventId) {
    return new Response(JSON.stringify({ status: "ignored" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const paymentRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${eventId}`,
    {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    }
  );

  if (!paymentRes.ok) {
    const text = await paymentRes.text();
    return new Response(JSON.stringify({ error: text }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  const payment = await paymentRes.json();
  const metadata = payment.metadata ?? {};
  const companyId = metadata.company_id as string | undefined;
  const planId = metadata.plan_id as string | undefined;
  const months = Number(metadata.months ?? 1);
  const status = payment.status ?? "unknown";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  await supabase.from("payments_history").insert({
    company_id: companyId ?? null,
    plan_id: planId ?? null,
    amount_paid: payment.transaction_amount ?? 0,
    payment_method: "mercadopago",
    payment_reference: String(payment.id ?? eventId),
    payment_date: new Date().toISOString(),
    status,
    months_paid: Number.isNaN(months) ? 1 : months,
  });

  if (status === "approved" && companyId && !Number.isNaN(months)) {
    const { data: company } = await supabase
      .from("companies")
      .select("subscription_ends_at")
      .eq("id", companyId)
      .maybeSingle();

    const now = new Date();
    const currentEndsAt = company?.subscription_ends_at
      ? new Date(company.subscription_ends_at)
      : null;
    const baseDate = currentEndsAt && currentEndsAt > now ? currentEndsAt : now;
    const newEndsAt = addDays(baseDate, months * 30);

    await supabase
      .from("companies")
      .update({
        subscription_ends_at: newEndsAt.toISOString(),
        subscription_status: "active",
        updated_at: now.toISOString(),
      })
      .eq("id", companyId);
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: jsonHeaders,
  });
});
