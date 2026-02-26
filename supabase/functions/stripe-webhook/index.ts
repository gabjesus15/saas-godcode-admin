import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const encoder = new TextEncoder();

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

async function verifyStripeSignature(secret: string, payload: string, signature: string) {
  const items = signature.split(",");
  const timestamp = items.find((item) => item.startsWith("t="))?.slice(2);
  const v1 = items.find((item) => item.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1) {
    return { ok: false, error: "Invalid signature" } as const;
  }

  const now = Math.floor(Date.now() / 1000);
  const timestampInt = Number(timestamp);
  if (Number.isNaN(timestampInt) || Math.abs(now - timestampInt) > 300) {
    return { ok: false, error: "Signature timestamp out of tolerance" } as const;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const hash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(hash, v1)) {
    return { ok: false, error: "Invalid signature" } as const;
  }

  return { ok: true } as const;
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const payload = await req.text();
  const verification = await verifyStripeSignature(webhookSecret, payload, signature);

  if (!verification.ok) {
    return new Response(JSON.stringify({ error: verification.error }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const event = JSON.parse(payload);

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ status: "ignored" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const session = event.data?.object;
  const metadata = session?.metadata ?? {};
  const companyId = metadata.company_id as string | undefined;
  const planId = metadata.plan_id as string | undefined;
  const months = Number(metadata.months ?? 1);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const paymentReference = session?.id ?? "stripe-session";
  const { data: existing } = await supabase
    .from("payments_history")
    .select("id")
    .eq("payment_reference", paymentReference)
    .maybeSingle();

  if (!existing) {
    await supabase.from("payments_history").insert({
      company_id: companyId ?? null,
      plan_id: planId ?? null,
      amount_paid: (session?.amount_total ?? 0) / 100,
      payment_method: "stripe",
      payment_reference: paymentReference,
      payment_date: new Date().toISOString(),
      status: "paid",
      months_paid: Number.isNaN(months) ? 1 : months,
    });
  }

  if (companyId && !Number.isNaN(months)) {
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
