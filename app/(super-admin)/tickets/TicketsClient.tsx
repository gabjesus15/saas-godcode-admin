"use client";
import dynamic from "next/dynamic";

const TicketsManager = dynamic(() => import("@/components/super-admin/tickets-manager").then(mod => mod.default), { ssr: false });

export function TicketsClient() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Tickets</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Mesa unificada de soporte para todos los negocios con SLA básico.
        </p>
      </div>

      <TicketsManager />
    </div>
  );
}
