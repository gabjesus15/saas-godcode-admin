import Link from "next/link";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getCurrentLocale } from "@/lib/i18n/server";
import { resolvePlanName } from "../../../lib/plan-i18n";
import { OnboardingStep2Form } from "../../../components/onboarding/OnboardingStep2Form";
import { OnboardingStepBar } from "../../../components/onboarding/OnboardingStepBar";

export const dynamic = "force-dynamic";

function ErrorCard({ title, text }: { title: string; text: string }) {
  return (
    <main className="onboarding-main relative mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-12 md:py-16">
      <OnboardingStepBar current={2} />
      <div className="onboarding-card mx-auto max-w-md p-6 text-center sm:p-8">
        <h2 className="text-lg font-bold text-red-600">{title}</h2>
        <p className="mt-3 text-sm text-slate-500">{text}</p>
        <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

export default async function OnboardingCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const raw = await searchParams;
  const tokenRaw = raw?.token;
  const token =
    typeof tokenRaw === "string"
      ? tokenRaw.trim()
      : Array.isArray(tokenRaw) && tokenRaw.length > 0
        ? String(tokenRaw[0]).trim()
        : null;
  if (!token) redirect("/onboarding?from=complete&reason=no_token");

  async function fetchApp() {
    const { data, error } = await supabaseAdmin
      .from("onboarding_applications")
      .select("*")
      .eq("verification_token", token)
      .maybeSingle();
    return { app: data, error };
  }

  const initialFetch = await fetchApp();
  let app = initialFetch.app;
  const error = initialFetch.error;

  if (error) {
    console.error("[ONBOARDING COMPLETE] Error al cargar aplicación:", error);
    return <ErrorCard title="Error de registro" text="No se pudo cargar la aplicación. Intenta de nuevo o contacta soporte." />;
  }
  if (!app) {
    return <ErrorCard title="Aplicación no encontrada" text="El enlace es inválido o la aplicación no existe." />;
  }

  if (app.status !== "email_verified" && app.status !== "form_completed") {
    await new Promise((r) => setTimeout(r, 800));
    const retry = await fetchApp();
    if (retry.error || !retry.app) {
      if (retry.error) console.error("[ONBOARDING COMPLETE] Error en reintento:", retry.error);
      return <ErrorCard title="Error de registro" text="No se pudo cargar la aplicación. Intenta de nuevo o contacta soporte." />;
    }
    app = retry.app;
  }

  if (app.status !== "email_verified" && app.status !== "form_completed") {
    return <ErrorCard title="Correo no verificado" text="Debes verificar tu correo antes de continuar. Revisa tu bandeja y haz clic en el enlace de verificación." />;
  }

  const locale = await getCurrentLocale();

  const [plansResult, addonsResult, applicationAddonsResult] = await Promise.all([
    supabaseAdmin.from("plans").select("id,name,name_i18n,price,max_branches").eq("is_active", true).order("price", { ascending: true }),
    supabaseAdmin.from("addons").select("id,slug,name,description,price_one_time,price_monthly,type,sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    supabaseAdmin.from("onboarding_application_addons").select("addon_id,quantity,price_snapshot").eq("application_id", app.id),
  ]);

  if (plansResult.error) {
    console.error("[ONBOARDING COMPLETE] Error al cargar planes:", plansResult.error);
    return <ErrorCard title="Error al cargar planes" text="No pudimos obtener los planes disponibles. Intenta de nuevo en unos minutos." />;
  }

  const plans = (plansResult.data ?? []).map((plan) => ({
    ...plan,
    name: resolvePlanName({ locale, name: plan.name, nameI18n: (plan as { name_i18n?: unknown }).name_i18n }),
  }));
  const addons = addonsResult.data ?? [];
  const applicationAddons = applicationAddonsResult.data ?? [];

  if (plans.length === 0) {
    return <ErrorCard title="Sin planes disponibles" text="No hay planes activos en este momento. Contacta a soporte para más información." />;
  }

  return (
    <main className="onboarding-main relative mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-12 md:py-16">
      <OnboardingStepBar current={2} />

      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Elige tu plan
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500 sm:text-base">
          Selecciona el plan que necesitas, añade extras si quieres, y continúa al pago.
        </p>
      </div>

      <OnboardingStep2Form
        token={token}
        initialData={{
          plan_id: app.plan_id,
          country: app.country,
          currency: app.currency,
          subscription_payment_method: app.subscription_payment_method,
          addons: applicationAddons,
          email: app.email,
        }}
        plans={plans}
        addons={addons}
      />
    </main>
  );
}
