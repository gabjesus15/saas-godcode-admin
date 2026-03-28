import Link from "next/link";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "../../../lib/supabase-admin";
import { OnboardingStep2Form } from "../../../components/onboarding/OnboardingStep2Form";

export const dynamic = "force-dynamic";

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
    return (
      <main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        <div className="onboarding-card max-w-md mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error de registro</h2>
          <p className="text-sm text-red-700">No se pudo cargar la aplicación. Intenta de nuevo o contacta soporte.</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }
  if (!app) {
    return (
      <main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        <div className="onboarding-card max-w-md mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Aplicación no encontrada</h2>
          <p className="text-sm text-red-700">El enlace es inválido o la aplicación no existe.</p>
          <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  // Propagación de escritura en Supabase: hasta 3 intentos con espera (evita redirigir al paso 1)
  const maxAttempts = 3;
  const waitMs = 2000;
  for (let attempt = 1; attempt <= maxAttempts && app.status !== "email_verified" && app.status !== "form_completed"; attempt++) {
    await new Promise((r) => setTimeout(r, waitMs));
    const retry = await fetchApp();
    if (retry.error || !retry.app) {
      if (retry.error) console.error("[ONBOARDING COMPLETE] Error en reintento:", retry.error);
      return (
        <main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
          <div className="onboarding-card max-w-md mx-auto p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error de registro</h2>
            <p className="text-sm text-red-700">No se pudo cargar la aplicación. Intenta de nuevo o contacta soporte.</p>
            <Link href="/onboarding" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline hover:no-underline">
              Volver al inicio
            </Link>
          </div>
        </main>
      );
    }
    app = retry.app;
  }
  if (app.status !== "email_verified" && app.status !== "form_completed") {
    return (
      <main className="onboarding-main relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        <div className="onboarding-card max-w-md mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Correo no verificado</h2>
          <p className="text-sm text-red-700">Debes verificar tu correo antes de continuar. Revisa tu bandeja y haz clic en el enlace de verificación.</p>
        </div>
      </main>
    );
  }

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
