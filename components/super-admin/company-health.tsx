import { Card } from "../ui/card";
import { MetricCard } from "./metric-card";
import { createSupabaseServerClient } from "../../utils/supabase/server";

interface CompanyHealthProps {
  companyId: string;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" });

export async function CompanyHealth({ companyId }: CompanyHealthProps) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_company_health", {
      p_company_id: companyId,
    });

    if (error) {
      throw error;
    }

    const metrics = data?.[0];

    return (
      <Card className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Salud del negocio</h3>
          <p className="text-sm text-zinc-500">
            Indicadores clave para detectar riesgos.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ordenes totales"
            value={`${metrics?.total_orders ?? 0}`}
            helper="Historico completo"
          />
          <MetricCard
            label="Ingresos"
            value={currency.format(Number(metrics?.total_revenue ?? 0))}
            helper="Total acumulado"
          />
          <MetricCard
            label="Ultima orden"
            value={
              metrics?.last_order_at
                ? dateFormatter.format(new Date(metrics.last_order_at))
                : "Sin datos"
            }
            helper="Ultima actividad"
          />
          <MetricCard
            label="Sucursales activas"
            value={`${metrics?.active_branches ?? 0}`}
            helper="Operativas"
          />
        </div>
      </Card>
    );
  } catch {
    return (
      <Card className="border-red-200 bg-red-50 text-sm text-red-700">
        No se pudo cargar la salud del negocio.
      </Card>
    );
  }
}
