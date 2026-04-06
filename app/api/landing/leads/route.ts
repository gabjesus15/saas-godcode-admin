import { NextRequest, NextResponse } from "next/server";

import { EMAIL_RE, getClientIp, landingFormRateOk, normalizeText } from "../../../../lib/landing-form-utils";
import { notifyLandingWebhooks } from "../../../../lib/landing-webhook";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!landingFormRateOk(`lead:${ip}`, 10)) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta en un minuto." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const email = normalizeText((body as { email?: string })?.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const ua = normalizeText(req.headers.get("user-agent"), 320);

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("landing_leads")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 400 });
  }

  if (existing?.id) {
    return NextResponse.json({ success: true, duplicate: true });
  }

  const nowIso = new Date().toISOString();

  const { data: inserted, error } = await supabaseAdmin
    .from("landing_leads")
    .insert({
      email,
      source: "landing_newsletter",
      metadata: {
        userAgent: ua || null,
        ip,
      },
    })
    .select("id,email,source,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await notifyLandingWebhooks("lead.created", {
    id: inserted?.id,
    email: inserted?.email ?? email,
    source: inserted?.source ?? "landing_newsletter",
    createdAt: inserted?.created_at ?? nowIso,
  });

  return NextResponse.json({ success: true, duplicate: false });
}
