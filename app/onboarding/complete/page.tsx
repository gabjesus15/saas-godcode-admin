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
    .select("id,status,legal_name,logo_url,fiscal_address,billing_address,billing_rut,billing_document,social_instagram,social_facebook,social_twitter,description,plan_id,business_name,country,currency,payment_methods,custom_plan_name,custom_plan_price,custom_domain,subscription_payment_method")
    .eq("verification_token", token)
    .maybeSingle();

  if (error || !app) redirect("/onboarding");
  if (app.status !== "email_verified" && app.status !== "form_completed") redirect("/onboarding");

  const [plansResult, addonsResult, applicationAddonsResult] = await Promise.all([
    supabaseAdmin.from("plans").select("id,name,price,max_branches").eq("is_active", true).order("price", { ascending: true }),
    supabaseAdmin.from("addons").select("id,slug,name,description,price_one_time,price_monthly,type,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    supabaseAdmin.from("onboarding_application_addons").select("addon_id,quantity,price_snapshot").eq("application_id", app.id),
  ]);

  const plans = plansResult.data ?? [];
  const addons = addonsResult.data ?? [];
  const applicationAddons = applicationAddonsResult.data ?? [];

  return (
    <>
      <main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        <div className="mb-6 flex justify-center sm:mb-8">
          <div className="onboarding-step-pill inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 min-[480px]:px-4 min-[480px]:py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold shadow-sm">2</span>
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider min-[480px]:text-[0.75rem]">Paso 2 de 3 — Datos del negocio</span>
          </div>
        </div>
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-xl font-bold text-zinc-800 min-[480px]:text-2xl sm:text-3xl">Completa los datos de tu negocio</h1>
          <p className="mt-3 text-sm font-medium text-zinc-700 min-[480px]:text-base">Elige plan, moneda y método de pago. Luego pasarás al pago seguro.</p>
        </div>
        <OnboardingStep2Form
          token={token}
          initialData={{ ...app, addons: applicationAddons }}
          plans={plans}
          addons={addons}
        />
      </main>
      <footer className="relative mt-12 px-4 py-5 text-center text-zinc-600 sm:mt-16 sm:py-6">
        Protegido con verificación de correo y encriptación.
      </footer>
    </>
  );
}
