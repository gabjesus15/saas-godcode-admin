import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

const windows = [
  { type: "expiring_7", days: 7 },
  { type: "expiring_1", days: 1 },
];

const startOfDayUtc = (date: Date) => {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Email provider error");
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const resendFrom = Deno.env.get("RESEND_FROM") ?? "";
  const appUrl = Deno.env.get("PUBLIC_APP_URL") ?? "";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const window of windows) {
    const start = startOfDayUtc(addDays(new Date(), window.days));
    const end = addDays(start, 1);

    const { data: companies, error } = await supabase
      .from("companies")
      .select("id,name,email,subscription_ends_at")
      .eq("subscription_status", "active")
      .not("subscription_ends_at", "is", null)
      .gte("subscription_ends_at", start.toISOString())
      .lt("subscription_ends_at", end.toISOString());

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    for (const company of companies ?? []) {
      const scheduledFor = start.toISOString().slice(0, 10);

      const { data: existing } = await supabase
        .from("subscription_notifications")
        .select("id")
        .eq("company_id", company.id)
        .eq("type", window.type)
        .eq("scheduled_for", scheduledFor)
        .maybeSingle();

      if (existing) {
        skipped += 1;
        continue;
      }

      const { data: notification, error: insertError } = await supabase
        .from("subscription_notifications")
        .insert({
          company_id: company.id,
          type: window.type,
          scheduled_for: scheduledFor,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !notification) {
        failed += 1;
        continue;
      }

      if (!company.email) {
        await supabase
          .from("subscription_notifications")
          .update({ status: "error", error: "Missing company email" })
          .eq("id", notification.id);
        failed += 1;
        continue;
      }

      if (!resendApiKey || !resendFrom) {
        await supabase
          .from("subscription_notifications")
          .update({
            status: "error",
            error: "Missing email provider configuration",
          })
          .eq("id", notification.id);
        failed += 1;
        continue;
      }

      try {
        const endsAt = company.subscription_ends_at
          ? new Date(company.subscription_ends_at)
          : null;
        const subject =
          window.type === "expiring_1"
            ? "Tu suscripcion vence manana"
            : "Tu suscripcion vence pronto";
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 16px;">
            <h2>Hola ${company.name ?? "cliente"}</h2>
            <p>Tu suscripcion vence en ${window.days} dias.</p>
            <p><strong>Fecha de vencimiento:</strong> ${
              endsAt ? endsAt.toDateString() : "--"
            }</p>
            <p>Renueva para evitar interrupciones.</p>
            ${
              appUrl
                ? `<p><a href="${appUrl}">Ir al panel</a></p>`
                : ""
            }
          </div>
        `;

        await sendEmail(resendApiKey, resendFrom, company.email, subject, html);

        await supabase
          .from("subscription_notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", notification.id);

        sent += 1;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Email send failed";
        await supabase
          .from("subscription_notifications")
          .update({ status: "error", error: message })
          .eq("id", notification.id);
        failed += 1;
      }
    }
  }

  return new Response(
    JSON.stringify({ sent, skipped, failed, timestamp: new Date().toISOString() }),
    { status: 200, headers: jsonHeaders }
  );
});
