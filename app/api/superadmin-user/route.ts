import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email, password, role, company_id } = await req.json();
  if (!email || !password || !role || !company_id) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  // 1. Crear usuario en Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }
  // 2. Guardar en tabla users
  const { error } = await supabaseAdmin.from("users").insert({
    email,
    role,
    company_id,
    auth_id: authUser.user?.id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  // Buscar auth_id
  const { data: userRow, error: userError } = await supabaseAdmin.from("users").select("auth_id").eq("id", id).maybeSingle();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
  if (userRow?.auth_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userRow.auth_id);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { id, email, role, password } = await req.json();
  if (!id || !email || !role) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  // Buscar auth_id
  const { data: userRow, error: userError } = await supabaseAdmin.from("users").select("auth_id").eq("id", id).maybeSingle();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });
  if (userRow?.auth_id) {
    if (password) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, { password });
      if (passError) return NextResponse.json({ error: passError.message }, { status: 400 });
    }
    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, { email });
      if (emailError) return NextResponse.json({ error: emailError.message }, { status: 400 });
    }
  }
  const { error } = await supabaseAdmin.from("users").update({ email, role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
