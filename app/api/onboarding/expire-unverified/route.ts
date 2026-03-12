import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Expire requests older than X days (default: 7 days)
const EXPIRATION_DAYS = 7;

export async function POST() {
  const cutoff = new Date(Date.now() - EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  // Only expire requests that are still pending_verification
  const { error } = await supabaseAdmin
    .from("onboarding_applications")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .eq("status", "pending_verification");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
