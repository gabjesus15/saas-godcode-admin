import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { OnboardingStep2Form } from "../../../components/onboarding/OnboardingStep2Form";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OnboardingCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/onboarding");

  const { data: app, error } = await supabaseAdmin
    .from("onboarding_applications")
    .select("id,status,legal_name,logo_url,fiscal_address,billing_address,billing_rut,social_instagram,social_facebook,social_twitter,description,plan_id,business_name")
    .eq("verification_token", token)
    .maybeSingle();

  if (error || !app) redirect("/onboarding");
  if (app.status !== "email_verified" && app.status !== "form_completed") redirect("/onboarding");

  const { data: plans } = await supabaseAdmin
    .from("plans")
    .select("id,name,price,max_branches")
    .eq("is_active", true)
    .order("price", { ascending: true });

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Paso 2 de 2
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Completa los datos</h1>
        <p className="mt-3 text-base text-zinc-600">Un paso más para activar tu cuenta</p>
      </div>
      <OnboardingStep2Form
        token={token}
        initialData={app}
        plans={plans ?? []}
      />
    </div>
  );
}
