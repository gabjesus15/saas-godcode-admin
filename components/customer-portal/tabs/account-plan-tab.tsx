"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { AddonOfferDecision } from "../../../lib/plan-offer-rules";
import { normalizeAddonIdentity } from "../customer-account-addon-utils";
import { ADDON_STATUS_LABELS } from "../customer-account-constants";
import { branchEntitlementStatusLabel, displayStatus, fmtDate, formatPaymentConfigKey, fmtMoney } from "../customer-account-format";
import type {
  ActiveAddon,
  AddonOption,
  AddonPurchasePreview,
  BillingMethodOption,
  BranchEntitlementSummary,
  CompanySnapshot,
  PlanChangePreview,
  PlanOption,
} from "../customer-account-types";
import { PortalPageHeader } from "../portal-page-header";
import { PortalSection } from "../portal-section";

export type PlanSection = "resumen" | "cambiar-plan" | "extras" | "referencia";

export type AccountPlanAddonMatrixRow = {
  addon: AddonOption;
  cells: Array<{ planId: string; decision: AddonOfferDecision }>;
};

export type AccountPlanTabProps = {
  company: CompanySnapshot;
  recommendedPlanOption: PlanOption | null;
  targetPlanId: string;
  setTargetPlanId: (id: string) => void;
  planMonthlyDelta: number | null;
  planAnnualDelta: number | null;
  setPlanMonths: (v: string) => void;
  activeAddonRows: ActiveAddon[];
  subscriptionEndsAt: string | null;
  subscriptionCancelReason: string;
  setSubscriptionCancelReason: (v: string) => void;
  subscriptionCancelError: string | null;
  subscriptionCancelOk: string | null;
  subscriptionCancelBusy: boolean;
  cancellationScheduled: boolean;
  subscriptionReactivateBusy: boolean;
  setSubscriptionCancelAcknowledge: (v: boolean) => void;
  setSubscriptionCancelFinalConfirm: (v: boolean) => void;
  setSubscriptionCancelModalOpen: (v: boolean) => void;
  canReactivateCancellation: boolean;
  handleReactivateSubscription: () => void;
  addonOfferMatrix: AccountPlanAddonMatrixRow[];
  availablePlans: PlanOption[];
  planPreview: PlanChangePreview | null;
  planPreviewLoading: boolean;
  selectedPlanOption: PlanOption | null;
  planMonths: string;
  planMethodSlug: string;
  setPlanMethodSlug: (v: string) => void;
  selectedPlanMethodOption: BillingMethodOption | null;
  planReason: string;
  setPlanReason: (v: string) => void;
  handlePlanRequest: () => void;
  planChangeBusy: boolean;
  acknowledgedImpactIds: string[];
  setAcknowledgedImpactIds: Dispatch<SetStateAction<string[]>>;
  availableAddons: AddonOption[];
  targetAddonId: string;
  setTargetAddonId: (v: string) => void;
  ownedAddonKeys: Set<string>;
  selectedAddonOption: AddonOption | null;
  selectedAddonModeLabel: string;
  selectedAddonSingleInstance: boolean;
  selectedAddonOwned: boolean;
  addonPreview: AddonPurchasePreview | null;
  addonPreviewLoading: boolean;
  setAddonQty: (v: string) => void;
  selectedAddonEffectiveQty: number;
  addonMonthsNumber: number;
  addonMonths: string;
  setAddonMonths: (v: string) => void;
  selectedAddonIsMonthly: boolean;
  addonMethodSlug: string;
  setAddonMethodSlug: (v: string) => void;
  selectedAddonMethodOption: BillingMethodOption | null;
  addonEstimatedUnit: number | null;
  addonEstimatedTotal: number | null;
  addonNotes: string;
  setAddonNotes: (v: string) => void;
  handleAddonRequest: () => void;
  addonPurchaseBusy: boolean;
  acknowledgedAddonImpactIds: string[];
  setAcknowledgedAddonImpactIds: Dispatch<SetStateAction<string[]>>;
  branchEntitlements: BranchEntitlementSummary[];
};

export function AccountPlanTab({
  company,
  recommendedPlanOption,
  targetPlanId,
  setTargetPlanId,
  planMonthlyDelta,
  planAnnualDelta,
  setPlanMonths,
  activeAddonRows,
  subscriptionEndsAt,
  subscriptionCancelReason,
  setSubscriptionCancelReason,
  subscriptionCancelError,
  subscriptionCancelOk,
  subscriptionCancelBusy,
  cancellationScheduled,
  subscriptionReactivateBusy,
  setSubscriptionCancelAcknowledge,
  setSubscriptionCancelFinalConfirm,
  setSubscriptionCancelModalOpen,
  canReactivateCancellation,
  handleReactivateSubscription,
  addonOfferMatrix,
  availablePlans,
  planPreview,
  planPreviewLoading,
  selectedPlanOption,
  planMonths,
  planMethodSlug,
  setPlanMethodSlug,
  selectedPlanMethodOption,
  planReason,
  setPlanReason,
  handlePlanRequest,
  planChangeBusy,
  acknowledgedImpactIds,
  setAcknowledgedImpactIds,
  availableAddons,
  targetAddonId,
  setTargetAddonId,
  ownedAddonKeys,
  selectedAddonOption,
  selectedAddonModeLabel,
  selectedAddonSingleInstance,
  selectedAddonOwned,
  addonPreview,
  addonPreviewLoading,
  setAddonQty,
  selectedAddonEffectiveQty,
  addonMonthsNumber,
  addonMonths,
  setAddonMonths,
  selectedAddonIsMonthly,
  addonMethodSlug,
  setAddonMethodSlug,
  selectedAddonMethodOption,
  addonEstimatedUnit,
  addonEstimatedTotal,
  addonNotes,
  setAddonNotes,
  handleAddonRequest,
  addonPurchaseBusy,
  acknowledgedAddonImpactIds,
  setAcknowledgedAddonImpactIds,
  branchEntitlements,
}: AccountPlanTabProps) {
  const [planSection, setPlanSection] = useState<PlanSection>("resumen");

  const segmentClass = (id: PlanSection) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
      planSection === id
        ? "bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-200/90 dark:bg-zinc-800 dark:text-indigo-200 dark:ring-indigo-500/35"
        : "text-zinc-600 hover:text-indigo-800 dark:text-zinc-400 dark:hover:text-indigo-200"
    }`;

  return (
    <div className="space-y-8">
      <div>
        <PortalPageHeader
          title="Suscripción y servicios"
          description="Usa las pestañas inferiores para resumen, cambio de plan, extras o tablas de referencia."
        />
        <div
          className="mt-6 flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-indigo-50/40 p-1 dark:border-zinc-800 dark:bg-indigo-950/25"
          role="tablist"
          aria-label="Secciones de plan"
        >
          {(
            [
              ["resumen", "Resumen"],
              ["cambiar-plan", "Cambiar plan"],
              ["extras", "Extras"],
              ["referencia", "Referencia"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={planSection === id}
              className={segmentClass(id)}
              onClick={() => setPlanSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {planSection === "resumen" ? (
        <>
      <PortalSection className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Vista general</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Tu situación actual</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Comparación con el plan recomendado e impacto económico estimado.
          </p>
    
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Plan actual</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{company.planName ?? "Sin plan"}</p>
              <p className="text-xs text-zinc-500">{fmtMoney(company.planPrice, company.currency, company.locale)} mensual</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Recomendado</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{recommendedPlanOption?.name ?? "-"}</p>
              <p className="text-xs text-zinc-500">{fmtMoney(recommendedPlanOption?.price ?? null, company.currency, company.locale)} mensual</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Impacto mensual</p>
              <p className={`font-semibold ${planMonthlyDelta != null && planMonthlyDelta > 0 ? "text-amber-700 dark:text-amber-300" : planMonthlyDelta != null && planMonthlyDelta < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                {planMonthlyDelta != null ? fmtMoney(planMonthlyDelta, company.currency, company.locale) : "-"}
              </p>
              <p className="text-xs text-zinc-500">vs plan actual</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Proyección anual</p>
              <p className={`font-semibold ${planAnnualDelta != null && planAnnualDelta > 0 ? "text-amber-700 dark:text-amber-300" : planAnnualDelta != null && planAnnualDelta < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                {planAnnualDelta != null ? fmtMoney(planAnnualDelta, company.currency, company.locale) : "-"}
              </p>
              <p className="text-xs text-zinc-500">estimado a 12 meses</p>
            </div>
          </div>
    
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (recommendedPlanOption?.id) {
                  setTargetPlanId(recommendedPlanOption.id);
                }
                setPlanSection("cambiar-plan");
              }}
              disabled={!recommendedPlanOption?.id || recommendedPlanOption.id === targetPlanId}
              className="h-10 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Usar plan recomendado
            </button>
            <button
              type="button"
              onClick={() => {
                if (recommendedPlanOption?.id) {
                  setTargetPlanId(recommendedPlanOption.id);
                  setPlanMonths("12");
                }
                setPlanSection("cambiar-plan");
              }}
              disabled={!recommendedPlanOption?.id}
              className="h-10 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Simular 12 meses
            </button>
          </div>
        </div>
      </PortalSection>

      <PortalSection className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Suscripción</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Plan contratado</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Plan</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{company.planName ?? "Sin plan"}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Precio mensual</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtMoney(company.planPrice, company.currency, company.locale)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Extras activos</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{activeAddonRows.length}</p>
            </div>
          </div>
    
          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/50">
              <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900 dark:text-zinc-100">Gestión de cancelación y reactivación</summary>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Solo abre esta sección cuando quieras gestionar cancelación al fin de ciclo.</p>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-slate-200/90 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cancelar plan</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Si cancelas ahora, el acceso seguirá funcionando hasta la fecha de vencimiento actual. Después de esa fecha, el tenant quedará suspendido.
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Fecha de vencimiento actual: <span className="font-medium text-zinc-700 dark:text-zinc-200">{fmtDate(subscriptionEndsAt, company.timezone)}</span>
                </p>
    
                <textarea
                  value={subscriptionCancelReason}
                  onChange={(event) => setSubscriptionCancelReason(event.target.value)}
                    placeholder="Motivo opcional de cancelación"
                  className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-slate-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  disabled={subscriptionCancelBusy || cancellationScheduled || subscriptionReactivateBusy}
                />
    
                {subscriptionCancelError ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {subscriptionCancelError}
                  </div>
                ) : null}
    
                {subscriptionCancelOk ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {subscriptionCancelOk}
                  </div>
                ) : null}
    
                <button
                  type="button"
                  onClick={() => {
                    setSubscriptionCancelAcknowledge(false);
                    setSubscriptionCancelFinalConfirm(false);
                    setSubscriptionCancelModalOpen(true);
                  }}
                  disabled={subscriptionCancelBusy || cancellationScheduled || subscriptionReactivateBusy}
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-red-700 bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-700 dark:hover:bg-red-600"
                >
                    {subscriptionCancelBusy
                      ? "Programando cancelación..."
                      : cancellationScheduled
                      ? "Cancelación ya programada"
                      : "Cancelar al final del ciclo"}
                </button>
    
                {canReactivateCancellation ? (
                  <button
                    type="button"
                    onClick={handleReactivateSubscription}
                    disabled={subscriptionReactivateBusy || subscriptionCancelBusy}
                    className="mt-2 inline-flex h-11 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                      {subscriptionReactivateBusy ? "Reactivando..." : "Reactivar suscripción"}
                  </button>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      </PortalSection>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
        <span className="text-zinc-500 dark:text-zinc-400">Continuar:</span>
        <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("cambiar-plan")}>
          Cambiar plan
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("extras")}>
          Extras
        </button>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("referencia")}>
          Referencia
        </button>
      </div>
        </>
      ) : planSection === "cambiar-plan" ? (
        <>
        <PortalSection>
        <div className="max-w-2xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Paso 1</p>
          <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Comparar planes</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Compara tu plan actual con el objetivo antes de confirmar.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Plan actual</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{planPreview?.currentPlan?.name ?? company.planName ?? "-"}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{fmtMoney(planPreview?.pricing.currentPrice ?? company.planPrice, company.currency, company.locale)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Plan objetivo</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{planPreview?.targetPlan?.name ?? selectedPlanOption?.name ?? "-"}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{fmtMoney(planPreview?.pricing.targetPrice ?? selectedPlanOption?.price ?? null, company.currency, company.locale)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Impacto mensual</p>
              <p className={`font-semibold ${(planPreview?.pricing.monthlyDiff ?? 0) > 0 ? "text-amber-700 dark:text-amber-300" : (planPreview?.pricing.monthlyDiff ?? 0) < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                {planPreview ? fmtMoney(planPreview.pricing.monthlyDiff, company.currency, company.locale) : "-"}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Pago inmediato: {planPreview ? fmtMoney(planPreview.pricing.amountDue, company.currency, company.locale) : "-"}</p>
            </div>
          </div>
          {planPreview?.execution?.mode === "scheduled_cycle_end" ? (
            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                El downgrade se programará para el cierre del ciclo actual. Fecha efectiva: {fmtDate(planPreview.execution.effectiveAt, company.timezone)}.
            </div>
          ) : null}
        </div>

          <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Cambio de plan</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Quiero cambiar mi plan</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Puedes cambiarlo directamente. Antes de confirmar, revisa impactos y avisos.</p>
    
            <div className="mt-3 flex flex-1 flex-col gap-3">
              <select
                value={targetPlanId}
                onChange={(event) => setTargetPlanId(event.target.value)}
                aria-label="Seleccionar plan"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
    
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={planMonths}
                  onChange={(event) => setPlanMonths(event.target.value)}
                  className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="Meses"
                  aria-label="Meses a pagar"
                />
                {planPreview?.pricing.requiresPayment ? (
                  <div className="space-y-2">
                    <select
                      value={planMethodSlug}
                      onChange={(event) => setPlanMethodSlug(event.target.value)}
                        aria-label="Método de pago para cambio de plan"
                      className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {planPreview.paymentMethods.map((method) => (
                        <option key={method.id} value={method.slug}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                    {selectedPlanMethodOption ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedPlanMethodOption.name}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            {selectedPlanMethodOption.auto_verify
                              ? "Validación automática. El cambio se aplica al confirmar el pago."
                              : "Validación manual. Debes cargar comprobante y esperar confirmación."}
                        </p>
                        {Object.entries(selectedPlanMethodOption.config).length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {Object.entries(selectedPlanMethodOption.config).map(([key, value]) => (
                              <p key={key} className="text-zinc-700 dark:text-zinc-300">
                                <span className="font-medium">{formatPaymentConfigKey(key)}:</span> {value}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid h-11 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                    No requiere pago adicional
                  </div>
                )}
              </div>
    
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-zinc-700 dark:text-zinc-300">Precio estimado: <span className="font-semibold">{fmtMoney(selectedPlanOption?.price ?? null, company.currency, company.locale)}</span></p>
                <p className="text-zinc-600 dark:text-zinc-400">Incluye hasta {selectedPlanOption?.max_branches ?? "-"} sucursales.</p>
                {planPreview ? (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Diferencia a pagar ahora: <span className="font-semibold">{fmtMoney(planPreview.pricing.amountDue, company.currency, company.locale)}</span>
                  </p>
                ) : null}
              </div>
    
              <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Impacto del cambio</p>
                {planPreviewLoading ? (
                  <p className="text-zinc-500 dark:text-zinc-400">Calculando impacto...</p>
                ) : !planPreview ? (
                  <p className="text-zinc-500 dark:text-zinc-400">No se pudo calcular impacto para este plan.</p>
                ) : planPreview.impacts.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400">Sin impactos detectados.</p>
                ) : (
                  planPreview.impacts.map((impact) => (
                    <label key={impact.id} className={`block rounded-lg border px-2 py-2 ${impact.level === "block" ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"}`}>
                      <div className="flex items-start gap-2">
                        {impact.level === "warn" ? (
                          <input
                            type="checkbox"
                            checked={acknowledgedImpactIds.includes(impact.id)}
                            onChange={(event) => {
                              setAcknowledgedImpactIds((prev) => {
                                if (event.target.checked) return [...new Set([...prev, impact.id])];
                                return prev.filter((id) => id !== impact.id);
                              });
                            }}
                            className="mt-0.5"
                          />
                        ) : (
                          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{impact.title}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{impact.detail}</p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
    
              <textarea
                value={planReason}
                onChange={(event) => setPlanReason(event.target.value)}
                placeholder="Opcional: cuéntanos qué necesitas mejorar"
                className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
    
              <button
                type="button"
                onClick={handlePlanRequest}
                disabled={planChangeBusy || planPreviewLoading || !planPreview}
                className="mt-auto h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {planChangeBusy
                  ? "Procesando..."
                  : (planPreview?.pricing.monthlyDiff ?? 0) < 0
                  ? "Programar downgrade al cierre"
                  : planPreview?.pricing.requiresPayment
                  ? "Pagar y cambiar plan"
                  : "Cambiar plan ahora"}
              </button>
            </div>
          </div>
        </div>
        </PortalSection>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
          <span className="text-zinc-500 dark:text-zinc-400">También:</span>
          <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("extras")}>
            Contratar extras
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("referencia")}>
            Tabla de planes e historial
          </button>
        </div>
        </>
      ) : planSection === "extras" ? (
        <>
        <PortalSection>
        <div className="max-w-2xl space-y-8">
          <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Contratar extra</p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Quiero agregar un extra</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Selecciona el servicio, revisa el impacto y compra desde aquí.</p>
    
            <div className="mt-3 flex flex-1 flex-col gap-3">
              <select
                value={targetAddonId}
                onChange={(event) => setTargetAddonId(event.target.value)}
                aria-label="Seleccionar extra"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {availableAddons.map((addon) => (
                  <option key={addon.id} value={addon.id}>
                    {addon.name}
                    {ownedAddonKeys.has(normalizeAddonIdentity({ id: addon.id, name: addon.name, type: addon.type })) ? " (Ya activo)" : ""}
                  </option>
                ))}
              </select>
    
              {selectedAddonOption ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
                    {selectedAddonModeLabel}
                  </span>
                  {selectedAddonSingleInstance ? (
                    <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                        Instancia única
                    </span>
                  ) : null}
                </div>
              ) : null}
    
              {selectedAddonOwned ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  Ya tienes este extra activo.
                  {selectedAddonSingleInstance
                    ? " No se puede comprar nuevamente."
                    : " Si necesitas otra configuración, escríbenos en notas."}
                </div>
              ) : null}
    
              {addonPreview?.planOffer?.status === "included" ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200">
                  {addonPreview.planOffer.reason}
                </div>
              ) : null}
    
              {addonPreview?.planOffer?.status === "blocked" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {addonPreview.planOffer.reason}
                </div>
              ) : null}
    
              <div className="grid max-w-[220px] grid-cols-[44px_1fr_44px] items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddonQty(String(Math.max(1, selectedAddonEffectiveQty - 1)))}
                  className="h-11 w-11 rounded-xl border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Disminuir cantidad"
                  disabled={selectedAddonSingleInstance}
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={selectedAddonEffectiveQty}
                  onChange={(event) => setAddonQty(event.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="Cantidad"
                  disabled={selectedAddonSingleInstance}
                />
                <button
                  type="button"
                  onClick={() => setAddonQty(String(selectedAddonEffectiveQty + 1))}
                  className="h-11 w-11 rounded-xl border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Aumentar cantidad"
                  disabled={selectedAddonSingleInstance}
                >
                  +
                </button>
              </div>
    
              {selectedAddonSingleInstance ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Este extra es de instancia única. La cantidad siempre será 1.</p>
              ) : null}
    
              <input
                type="number"
                min={1}
                max={24}
                value={selectedAddonIsMonthly ? addonMonthsNumber : 1}
                onChange={(event) => setAddonMonths(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder={selectedAddonIsMonthly ? "Meses" : "Meses (no aplica)"}
                aria-label="Meses para extra"
                disabled={!selectedAddonIsMonthly}
              />
    
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedAddonIsMonthly
                  ? "Este extra se cobra por mes y queda co-terminado con tu plan."
                  : "Este extra se cobra una sola vez. El campo de meses no aplica."}
              </p>
    
              {addonPreview?.pricing.requiresPayment ? (
                <div className="space-y-2">
                  <select
                    value={addonMethodSlug}
                    onChange={(event) => setAddonMethodSlug(event.target.value)}
                      aria-label="Método de pago para extra"
                    className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {addonPreview.paymentMethods.map((method) => (
                      <option key={method.id} value={method.slug}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  {selectedAddonMethodOption ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedAddonMethodOption.name}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">
                          {selectedAddonMethodOption.auto_verify
                            ? "Validación automática. Se activa al confirmar el pago."
                            : "Validación manual. Se activará al validar el comprobante."}
                      </p>
                      {Object.entries(selectedAddonMethodOption.config).length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {Object.entries(selectedAddonMethodOption.config).map(([key, value]) => (
                            <p key={key} className="text-zinc-700 dark:text-zinc-300">
                              <span className="font-medium">{formatPaymentConfigKey(key)}:</span> {value}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid h-11 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                  No requiere pago adicional
                </div>
              )}
    
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-zinc-700 dark:text-zinc-300">Precio unitario: <span className="font-semibold">{fmtMoney(addonPreview?.pricing.unitPrice ?? addonEstimatedUnit, company.currency, company.locale)}</span></p>
                <p className="text-zinc-700 dark:text-zinc-300">Total estimado: <span className="font-semibold">{fmtMoney(addonPreview?.pricing.amountDue ?? addonEstimatedTotal, company.currency, company.locale)}</span></p>
                  <p className="text-zinc-600 dark:text-zinc-400">{selectedAddonIsMonthly ? "Cobro mensual co-terminado con tu plan." : "Cobro único."}</p>
              </div>
    
              <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Impacto del extra</p>
                {addonPreviewLoading ? (
                  <p className="text-zinc-500 dark:text-zinc-400">Calculando impacto...</p>
                ) : !addonPreview ? (
                  <p className="text-zinc-500 dark:text-zinc-400">No se pudo calcular impacto para este extra.</p>
                ) : addonPreview.impacts.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400">Sin impactos detectados.</p>
                ) : (
                  addonPreview.impacts.map((impact) => (
                    <label key={impact.id} className={`block rounded-lg border px-2 py-2 ${impact.level === "block" ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"}`}>
                      <div className="flex items-start gap-2">
                        {impact.level === "warn" ? (
                          <input
                            type="checkbox"
                            checked={acknowledgedAddonImpactIds.includes(impact.id)}
                            onChange={(event) => {
                              setAcknowledgedAddonImpactIds((prev) => {
                                if (event.target.checked) return [...new Set([...prev, impact.id])];
                                return prev.filter((id) => id !== impact.id);
                              });
                            }}
                            className="mt-0.5"
                          />
                        ) : (
                          <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{impact.title}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{impact.detail}</p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
    
              <textarea
                value={addonNotes}
                onChange={(event) => setAddonNotes(event.target.value)}
                placeholder="Opcional: agrega contexto para soporte"
                className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
    
              <button
                type="button"
                onClick={handleAddonRequest}
                disabled={addonPurchaseBusy || addonPreviewLoading || !addonPreview || (selectedAddonSingleInstance && selectedAddonOwned)}
                className="mt-auto h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {addonPurchaseBusy
                  ? "Procesando..."
                  : addonPreview?.pricing.requiresPayment
                  ? "Pagar y activar extra"
                  : "Activar extra ahora"}
              </button>
            </div>
          </div>
        </div>
        </PortalSection>

        <PortalSection>
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Extras activos</p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Tus servicios habilitados</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Servicios que ya tienes en tu cuenta.</p>
            <div className="mt-3 flex min-h-[12rem] flex-col gap-2">
              {activeAddonRows.length === 0 ? (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
                  Aún no tienes extras activos.
                </div>
              ) : (
                activeAddonRows.map((addon) => (
                  <div key={addon.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{addon.addonName}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">Estado: {displayStatus(addon.status, ADDON_STATUS_LABELS)}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">Tipo: {addon.expires_at ? "Mensual co-terminado" : "Pago único"}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">Vence: {fmtDate(addon.expires_at, company.timezone)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </PortalSection>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
          <span className="text-zinc-500 dark:text-zinc-400">Ir a:</span>
          <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("resumen")}>
            Resumen
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("cambiar-plan")}>
            Cambiar plan
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("referencia")}>
            Referencia
          </button>
        </div>
        </>
      ) : (
        <>
          <PortalSection>
            <details className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm open:pb-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                Comparar inclusión por plan
              </summary>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Verde: incluido. Rojo: bloqueado. Gris: disponible para contratar. Usa la misma lógica de políticas que el servidor.
              </p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                <table className="min-w-[760px] w-full border-collapse text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr>
                      <th className="sticky left-0 z-10 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
                        Extra
                      </th>
                      {availablePlans.map((plan) => (
                        <th
                          key={`m-head-${plan.id}`}
                          className={`border-b border-zinc-200 px-3 py-2 text-left font-semibold dark:border-zinc-700 ${
                            company.planId === plan.id
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                              : "text-zinc-700 dark:text-zinc-200"
                          }`}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addonOfferMatrix.map((row) => (
                      <tr
                        key={`m-row-${row.addon.id}`}
                        className="odd:bg-white even:bg-zinc-50/40 dark:odd:bg-zinc-900/60 dark:even:bg-zinc-800/30"
                      >
                        <td className="sticky left-0 z-10 border-b border-zinc-200 bg-inherit px-3 py-2 align-top dark:border-zinc-700">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.addon.name}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.addon.slug || row.addon.type || "extra"}</p>
                        </td>
                        {row.cells.map((cell) => (
                          <td key={`m-cell-${row.addon.id}-${cell.planId}`} className="border-b border-zinc-200 px-3 py-2 align-top dark:border-zinc-700">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${
                                cell.decision.status === "included"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : cell.decision.status === "blocked"
                                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                                    : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              {cell.decision.status === "included"
                                ? "Incluido"
                                : cell.decision.status === "blocked"
                                  ? "Bloqueado"
                                  : "Disponible"}
                            </span>
                            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{cell.decision.reason}</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </PortalSection>

          <PortalSection>
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Historial</p>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Compras de sucursales extra</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Historial resumido para seguimiento rápido.</p>
              <div className="mt-3 flex min-h-[16rem] flex-col space-y-2 overflow-y-auto pr-1">
                {branchEntitlements.length === 0 ? (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
                    Todavía no hay compras registradas.
                  </div>
                ) : (
                  branchEntitlements.map((entitlement) => (
                    <div key={entitlement.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {entitlement.quantity} sucursal(es) · {fmtMoney(entitlement.amountPaid, company.currency, company.locale)}
                        </p>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(entitlement.createdAt, company.timezone)}</span>
                      </div>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Estado: {branchEntitlementStatusLabel(entitlement.status)}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Referencia: {entitlement.paymentReference ?? "-"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </PortalSection>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
            <span className="text-zinc-500 dark:text-zinc-400">Ir a:</span>
            <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("resumen")}>
              Resumen
            </button>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("cambiar-plan")}>
              Cambiar plan
            </button>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <button type="button" className="font-medium text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => setPlanSection("extras")}>
              Extras
            </button>
          </div>
        </>
      )}
    </div>
  );
}
