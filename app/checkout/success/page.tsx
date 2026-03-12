import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

import { Badge } from "../../../components/ui/badge";
import { CheckoutSuccessFinalize } from "../../../components/onboarding/CheckoutSuccessFinalize";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

const statusBadge: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  paid: "success",
  approved: "success",
  pending: "warning",
  rejected: "destructive",
  cancelled: "destructive",
};

async function getPayment(ref?: string) {
  if (!ref) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments_history")
    .select("id,company_id,plan_id,amount_paid,months_paid,status,payment_method")
    .eq("payment_reference", ref)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const [{ data: company }, { data: plan }] = await Promise.all([
    supabase
      .from("companies")
      .select("name")
      .eq("id", data.company_id)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("name")
      .eq("id", data.plan_id)
      .maybeSingle(),
  ]);

  return {
    ...data,
    companyName: company?.name ?? "--",
    planName: plan?.name ?? "--",
  };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const ref = Array.isArray(resolvedParams.ref)
    ? resolvedParams.ref[0]
    : resolvedParams.ref;
  const payment = await getPayment(ref);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#ffffff_45%,_#f8fafc_100%)]">
      <CheckoutSuccessFinalize refParam={ref} />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Pago confirmado
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              Gracias. Tu suscripcion ya esta activa.
            </h1>
            <p className="text-base text-zinc-600 sm:text-lg">
              Recibimos tu pago y habilitamos el acceso completo. Puedes volver al
              panel para revisar tu estado y administrar la empresa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Ir al panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Ver empresas
              </Link>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 text-sm text-zinc-600 shadow-sm backdrop-blur">
              Si necesitas soporte, responde al correo de confirmacion o escribe a
              nuestro equipo de facturacion.
            </div>
          </div>

          <div className="relative rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="absolute -top-8 right-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Resumen
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                  Acceso habilitado
                </h2>
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Estado
                  </p>
                  <p className="text-base font-semibold text-emerald-700">
                    Activo
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Proximo paso
                  </p>
                  <p className="text-base font-semibold text-zinc-900">
                    Configurar sucursales y equipo
                  </p>
                </div>
              </div>

              {payment ? (
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Detalle de pago
                    </span>
                    <Badge variant={statusBadge[payment.status ?? "neutral"] ?? "neutral"}>
                      {payment.status ?? "--"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p>
                      Empresa: <span className="font-semibold">{payment.companyName}</span>
                    </p>
                    <p>
                      Plan: <span className="font-semibold">{payment.planName}</span>
                    </p>
                    <p>
                      Meses: <span className="font-semibold">{payment.months_paid ?? 1}</span>
                    </p>
                    <p>
                      Metodo: <span className="font-semibold">{payment.payment_method ?? "--"}</span>
                    </p>
                    <p>
                      Referencia: <span className="font-semibold">{ref}</span>
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="text-xs text-zinc-500">
                Esta pantalla es informativa. El panel refleja el estado real de la
                suscripcion.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
