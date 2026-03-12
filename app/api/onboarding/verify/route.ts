import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token faltante" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("onboarding_applications")
    .select("id, status, email_verified_at")
    .eq("verification_token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Error al verificar" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 404 });
  }
  if (data.status !== "pending_verification") {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      status: data.status,
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
    return NextResponse.json({ error: "Error al confirmar" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token,
    message: "Email verificado. Puedes continuar con el formulario.",
  });
}
