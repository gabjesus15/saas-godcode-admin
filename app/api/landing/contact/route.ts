import { NextRequest, NextResponse } from "next/server";

import { EMAIL_RE, getClientIp, landingFormRateOk, normalizeText } from "../../../../lib/landing-form-utils";
import { notifyLandingWebhooks } from "../../../../lib/landing-webhook";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!landingFormRateOk(`contact:${ip}`, 6)) {
    return NextResponse.json({ error: "Demasiados intentos. Intenta en un minuto." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const payload = body as { name?: string; email?: string; message?: string };
  const name = normalizeText(payload?.name, 120);
  const email = normalizeText(payload?.email, 160).toLowerCase();
  const message = normalizeText(payload?.message, 2000);

  if (message.length < 10) {
    return NextResponse.json({ error: "El mensaje debe tener al menos 10 caracteres." }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const ua = normalizeText(req.headers.get("user-agent"), 320);

  const nowIso = new Date().toISOString();

  const { data: inserted, error } = await supabaseAdmin
    .from("landing_contacts")
    .insert({
      name: name || null,
      email: email || null,
      message,
      source: "landing_contact_form",
      metadata: {
        userAgent: ua || null,
        ip,
      },
    })
    .select("id,name,email,message,source,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await notifyLandingWebhooks("contact.created", {
    id: inserted?.id,
    name: inserted?.name ?? name,
    email: inserted?.email ?? email,
    message: inserted?.message ?? message,
    source: inserted?.source ?? "landing_contact_form",
    createdAt: inserted?.created_at ?? nowIso,
  });

  return NextResponse.json({ success: true });
}
