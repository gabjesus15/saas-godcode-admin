"use client";

import type { BillingPaymentResponse, PaymentSummary, CompanySnapshot } from "../customer-account-types";
import { displayStatus, fmtDate, fmtMoney } from "../customer-account-format";
import { PAYMENT_STATUS_LABELS } from "../customer-account-constants";
import { PortalPageHeader } from "../portal-page-header";

export type AccountFacturacionTabProps = {
  company: CompanySnapshot;
  billingPaidTotal: number | null;
  billingPendingTotal: number | null;
  pendingPaymentsCount: number;
  latestPaidPaymentDate: string | null;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (v: string) => void;
  paymentReferenceQuery: string;
  setPaymentReferenceQuery: (v: string) => void;
  paymentDateFrom: string;
  setPaymentDateFrom: (v: string) => void;
  paymentDateTo: string;
  setPaymentDateTo: (v: string) => void;
  filteredPayments: PaymentSummary[];
  createdExpansionPayment: BillingPaymentResponse | null;
  onExportPaymentsCsv: () => void;
  onOpenBillingSupport: (payment: PaymentSummary) => void;
};

export function AccountFacturacionTab({
  company,
  billingPaidTotal,
  billingPendingTotal,
  pendingPaymentsCount,
  latestPaidPaymentDate,
  paymentStatusFilter,
  setPaymentStatusFilter,
  paymentReferenceQuery,
  setPaymentReferenceQuery,
  paymentDateFrom,
  setPaymentDateFrom,
  paymentDateTo,
  setPaymentDateTo,
  filteredPayments,
  createdExpansionPayment,
  onExportPaymentsCsv,
  onOpenBillingSupport,
}: AccountFacturacionTabProps) {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Pagos y comprobantes"
        description="Historial filtrable y exportación CSV. Para reclamos, usa Soporte · Facturación."
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500">Total pagado</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtMoney(billingPaidTotal, company.currency, company.locale)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500">Pendiente</p>
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">{fmtMoney(billingPendingTotal, company.currency, company.locale)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500">Pagos pendientes</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{pendingPaymentsCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500">Último pago aprobado</p>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtDate(latestPaidPaymentDate, company.timezone)}</p>
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-indigo-100/70 bg-indigo-50/35 dark:border-indigo-500/20 dark:bg-indigo-950/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-indigo-950 dark:text-indigo-100 [&::-webkit-details-marker]:hidden">
          Filtros de tabla
        </summary>
        <div className="grid gap-2 border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value)}
            aria-label="Filtrar por estado de pago"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="pending_validation">Pendiente de validación</option>
            <option value="paid">Pagado</option>
            <option value="failed">Fallido</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <input
            type="text"
            value={paymentReferenceQuery}
            onChange={(event) => setPaymentReferenceQuery(event.target.value)}
            placeholder="Buscar referencia"
            aria-label="Buscar por referencia"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="date"
            value={paymentDateFrom}
            onChange={(event) => setPaymentDateFrom(event.target.value)}
            aria-label="Fecha desde"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="date"
            value={paymentDateTo}
            onChange={(event) => setPaymentDateTo(event.target.value)}
            aria-label="Fecha hasta"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Historial de pagos</h3>
        <button
          type="button"
          onClick={onExportPaymentsCsv}
          className="h-10 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Exportar CSV
        </button>
      </div>

      {createdExpansionPayment &&
      ["pending", "pending_validation"].includes(createdExpansionPayment.payment.status ?? "") ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Hay una orden de expansión pendiente de validación: {createdExpansionPayment.payment.payment_reference}. Puedes
          completar o verificar el comprobante desde la pestaña de Sucursales.
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">Monto</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Método</th>
              <th className="px-2 py-2">Meses</th>
              <th className="px-2 py-2">Referencia</th>
              <th className="px-2 py-2">Comprobante</th>
              <th className="px-2 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-3 text-zinc-500">
                  No hay pagos para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="px-2 py-2">{fmtDate(payment.payment_date, company.timezone)}</td>
                  <td className="px-2 py-2">{fmtMoney(payment.amount_paid, company.currency, company.locale)}</td>
                  <td className="px-2 py-2">{displayStatus(payment.status, PAYMENT_STATUS_LABELS)}</td>
                  <td className="px-2 py-2">{payment.payment_method ?? "-"}</td>
                  <td className="px-2 py-2">{payment.months_paid ?? "-"}</td>
                  <td className="px-2 py-2">{payment.payment_reference ?? "-"}</td>
                  <td className="px-2 py-2">
                    {payment.reference_file_url ? (
                      <a
                        href={payment.reference_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenBillingSupport(payment)}
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Reportar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
        Si necesitas factura o ajuste de cobro, usa la pestaña de Soporte y categoría Facturación.
      </div>
    </section>
    </div>
  );
}
