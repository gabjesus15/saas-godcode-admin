import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const clpCurrency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const getUsdToClp = async () => {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 43200 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const rate = Number(data?.rates?.CLP ?? 0);
    return rate > 0 ? rate : null;
  } catch {
    return null;
  }
};

const featureLabels: Record<string, string> = {
  crm: "CRM",
  cash: "Caja",
  menu: "Menu",
};

export default async function PlansPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const [rate, plansResult] = await Promise.all([
      getUsdToClp(),
      supabase
        .from("plans")
        .select("id,name,price,max_branches,is_public,features")
        .order("price", { ascending: true }),
    ]);
    const { data, error } = plansResult;

    if (error) {
      throw error;
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Planes</h2>
          <p className="text-sm text-zinc-500">
            Controla la oferta y limites del SaaS.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {plan.name ?? "Sin nombre"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold text-zinc-900">
                    {currency.format(Number(plan.price ?? 0))} / mes
                  </h3>
                  {plan.is_public === false ? (
                    <Badge variant="destructive">Solo interno</Badge>
                  ) : null}
                  {rate ? (
                    <span className="text-xs text-zinc-500">
                      {clpCurrency.format(Number(plan.price ?? 0) * rate)} aprox
                    </span>
                  ) : null}
                </div>
              </div>
              {plan.name?.toLowerCase() === "basico" ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Incluye CRM, Caja y Menu.
                  </div>
                  <ul className="grid gap-2 text-sm text-zinc-600">
                    <li>1 sucursal incluida.</li>
                    <li>Sucursales extra: $100 / mes c/u.</li>
                    <li>Soporte basico.</li>
                  </ul>
                </div>
              ) : plan.name?.toLowerCase().includes("beta") ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    Acceso gratis por 1 mes a casi todas las funciones.
                  </div>
                  <ul className="grid gap-2 text-sm text-zinc-600">
                    <li>CRM, Caja y Menu incluidos.</li>
                    <li>Sucursales ilimitadas durante el beta.</li>
                    <li>Soporte prioritario durante el mes gratis.</li>
                  </ul>
                </div>
              ) : plan.name?.toLowerCase().includes("dev") ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
                    Plan interno con acceso ilimitado.
                  </div>
                  <ul className="grid gap-2 text-sm text-zinc-600">
                    <li>Acceso completo a todas las funciones.</li>
                    <li>Sucursales ilimitadas sin vencimiento.</li>
                    <li>Soporte directo para el equipo interno.</li>
                  </ul>
                </div>
              ) : plan.features ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                    Modulos incluidos:
                  </div>
                  <ul className="grid gap-2 text-sm text-zinc-600">
                    {Object.entries(plan.features as Record<string, boolean>)
                      .filter(([, enabled]) => enabled)
                      .map(([key]) => (
                        <li key={key}>{featureLabels[key] ?? key}</li>
                      ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  Max sucursales: {" "}
                  <span className="font-semibold">{plan.max_branches ?? 0}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar el listado de planes.
      </div>
    );
  }
}
