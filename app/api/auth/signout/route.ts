import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "../../../../utils/supabase/server";

export async function POST(request: Request) {
  try {
    const superAdmin = await createSupabaseServerClient("super-admin");
    const tenant = await createSupabaseServerClient("tenant");

    await Promise.allSettled([superAdmin.auth.signOut(), tenant.auth.signOut()]);
  } catch {
    // No romper logout por fallas transitorias de sesión.
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
