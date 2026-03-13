"use client";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pendiente verificación",
  email_verified: "Email verificado",
  form_completed: "Formulario completo",
  payment_pending: "Pago pendiente",
  active: "Activo",
  rejected: "Rechazado",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  pending_verification: "warning",
  email_verified: "neutral",
  form_completed: "neutral",
  payment_pending: "warning",
  active: "success",
  rejected: "destructive",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { useEffect, useState } from "react";

export default function OnboardingSolicitudesPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("onboarding_applications")
      .select("id,business_name,responsible_name,email,sector,status,created_at,company_id,country,currency,document_type,document_number,phone,address,plan_id,notes,updated_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setApps(data ?? []);
      });
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Error al cargar solicitudes: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Solicitudes de onboarding
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Revisa las solicitudes de nuevos negocios y su estado.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Negocio</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Responsable</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Rubro</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Estado</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Fecha</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300"></th>
              </tr>
            </thead>
            <tbody>
              {(apps ?? []).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.business_name ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.responsible_name ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.email ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {row.sector ?? "--"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        STATUS_VARIANTS[row.status ?? ""] ?? "neutral"
                      }
                    >
                      {STATUS_LABELS[row.status ?? ""] ?? row.status ?? "--"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {row.company_id ? (
                      <Link
                        href={`/companies/${row.company_id}`}
                        className="text-zinc-900 underline hover:no-underline dark:text-zinc-100"
                      >
                        Ver empresa
                      </Link>
                    ) : (
                      <span className="text-zinc-400">--</span>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={async () => {
                        await fetch("/api/onboarding/delete", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: row.id }),
                        });
                        window.location.reload();
                      }}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!apps || apps.length === 0) && (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            No hay solicitudes aún
          </div>
        )}
      </div>
    </div>
  );
}
