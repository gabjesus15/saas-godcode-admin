"use client";

import type {
  AccountActivityItem,
  BranchSummary,
  CompanySnapshot,
  PaymentSummary,
  PortalTab,
  TicketSummary,
} from "../customer-account-types";
import { displayStatus, fmtDate, fmtMoney } from "../customer-account-format";
import { SUBSCRIPTION_STATUS_LABELS } from "../customer-account-constants";
import { PortalPageHeader } from "../portal-page-header";
import { PortalSection } from "../portal-section";

export type AccountAlert = {
  id: string;
  tone: "warn" | "info" | "ok";
  title: string;
  description: string;
};

export type AccountResumenTabProps = {
  company: CompanySnapshot;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  activeEntitlementsCount: number;
  activeBranchesCount: number;
  openTicketsCount: number;
  branches: BranchSummary[];
  tickets: TicketSummary[];
  latestPayment: PaymentSummary | null;
  accountAlerts: AccountAlert[];
  expiryDays: number | null;
  cancellationScheduled: boolean;
  filteredActivityTimeline: AccountActivityItem[];
  activityFilter: "all" | "pago" | "ticket" | "extra";
  setActivityFilter: (v: "all" | "pago" | "ticket" | "extra") => void;
  onNavigate: (tab: PortalTab) => void;
};

export function AccountResumenTab({
  company,
  subscriptionStatus,
  subscriptionEndsAt,
  activeEntitlementsCount,
  activeBranchesCount,
  openTicketsCount,
  branches,
  tickets,
  latestPayment,
  accountAlerts,
  expiryDays,
  cancellationScheduled,
  filteredActivityTimeline,
  activityFilter,
  setActivityFilter,
  onNavigate,
}: AccountResumenTabProps) {
  return (
    <>
      <PortalSection>
        <PortalPageHeader
          title="Estado de tu cuenta"
          description="Resumen de plan, pagos, sucursales y soporte según tu suscripción."
          aside={
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-right dark:border-zinc-700 dark:bg-zinc-800/60">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Suscripción</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {displayStatus(subscriptionStatus, SUBSCRIPTION_STATUS_LABELS)}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Vence: {fmtDate(subscriptionEndsAt)}</p>
            </div>
          }
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Plan</p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{company.planName ?? "Sin plan"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{fmtMoney(company.planPrice)} mensual</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Extras de sucursal activos: {activeEntitlementsCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Sucursales activas</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{activeBranchesCount}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total registradas: {branches.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Tickets abiertos</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{openTicketsCount}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total tickets: {tickets.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Último pago</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{latestPayment ? fmtMoney(latestPayment.amount_paid) : "-"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{latestPayment ? fmtDate(latestPayment.payment_date) : "Sin pagos"}</p>
          </div>
        </div>
      </PortalSection>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
        <PortalSection>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Alertas</h2>
          <div className="mt-4 space-y-2">
            {accountAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  alert.tone === "warn"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                    : alert.tone === "info"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                }`}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="mt-1 text-xs opacity-90">{alert.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Vencimiento</p>
            <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{fmtDate(subscriptionEndsAt)}</p>
            {expiryDays != null ? (
              <p className={`text-sm ${expiryDays <= 7 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {expiryDays >= 0
                  ? `Quedan ${expiryDays} día${expiryDays === 1 ? "" : "s"}`
                  : `Vencido hace ${Math.abs(expiryDays)} día${Math.abs(expiryDays) === 1 ? "" : "s"}`}
              </p>
            ) : null}
            {cancellationScheduled ? (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                Cancelación programada: tu servicio seguirá activo hasta el vencimiento.
              </p>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Próximas acciones</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onNavigate("plan")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Revisar plan y extras
              </button>
              <button
                type="button"
                onClick={() => onNavigate("facturacion")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Ver pagos y comprobantes
              </button>
              <button
                type="button"
                onClick={() => onNavigate("sucursales")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Solicitar nueva sucursal
              </button>
              <button
                type="button"
                onClick={() => onNavigate("soporte")}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Abrir o responder ticket
              </button>
            </div>
          </div>
        </PortalSection>

        <PortalSection>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Actividad reciente</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pagos, tickets y compras de extras.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["all", "Todo"],
                ["pago", "Pagos"],
                ["ticket", "Tickets"],
                ["extra", "Extras"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActivityFilter(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activityFilter === value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-100"
                    : "border-zinc-300 text-zinc-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {filteredActivityTimeline.length === 0 ? (
              <p className="text-sm text-zinc-500">Aún no hay actividad para mostrar.</p>
            ) : (
              filteredActivityTimeline.map((item) => (
                <div key={item.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(item.occurredAt)}</span>
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.detail}</p>
                </div>
              ))
            )}
          </div>
        </PortalSection>
      </div>
    </>
  );
}
