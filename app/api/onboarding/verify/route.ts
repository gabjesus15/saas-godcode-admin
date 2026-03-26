import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

export async function GET(req: NextRequest) {
  const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/verify");
  if (proxied) return proxied;
  const token = req.nextUrl.searchParams.get("token");
  console.log("[ONBOARDING VERIFY] Token recibido:", token);
  if (!token) {
    console.error("[ONBOARDING VERIFY] Token faltante");
    return NextResponse.json({ error: "Token faltante" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("onboarding_applications")
    .select("id, status, email_verified_at")
    .eq("verification_token", token)
    .maybeSingle();

  if (error) {
    console.error("[ONBOARDING VERIFY] Error al consultar Supabase:", error);
    return NextResponse.json({ error: "Error al verificar", log: error }, { status: 500 });
  }
  if (!data) {
    console.warn("[ONBOARDING VERIFY] No se encontró aplicación para token:", token);
    return NextResponse.json({ error: "Enlace inválido o expirado", log: token }, { status: 404 });
  }
  if (data.status !== "pending_verification") {
    console.log("[ONBOARDING VERIFY] Token ya verificado o status distinto:", data.status);
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      status: data.status,
      log: data,
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from("onboarding_applications")
    .update({
      status: "email_verified",
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    console.error("[ONBOARDING VERIFY] Error al actualizar status:", updateError);
    return NextResponse.json({ error: "Error al confirmar", log: updateError }, { status: 500 });
  }

  console.log("[ONBOARDING VERIFY] Email verificado correctamente para token:", token);
  return NextResponse.json({
    ok: true,
    token,
    message: "Email verificado. Puedes continuar con el formulario.",
    log: data,
  });
}
