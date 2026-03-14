import { MetricCardClient } from "./MetricCardClient";
import { createSupabaseServerClient } from "../../../utils/supabase/server";

export default async function DashboardPage() {
  try {
    const supabase = await createSupabaseServerClient();

    const [{ count: activeCount, error: activeError }, { count: suspendedCount, error: suspendedError }] =
      await Promise.all([
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("subscription_status", "active"),
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .eq("subscription_status", "suspended"),
      ]);

    if (activeError || suspendedError) {
      throw activeError ?? suspendedError;
    }

    return (
      <div className="grid min-w-0 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCardClient
          label="Empresas activas"
          value={`${activeCount ?? 0}`}
          helper="Contratos en curso"
        />
        <MetricCardClient
          label="Empresas suspendidas"
          value={`${suspendedCount ?? 0}`}
          helper="Clientes con acceso limitado"
        />
        <MetricCardClient
          label="MRR"
          value="$0"
          helper="Placeholder hasta integrar facturacion"
        />
      </div>
    );
  } catch {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudieron cargar los indicadores. Intenta mas tarde.
      </div>
    );
  }
}
