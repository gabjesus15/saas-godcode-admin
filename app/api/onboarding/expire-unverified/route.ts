import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

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
