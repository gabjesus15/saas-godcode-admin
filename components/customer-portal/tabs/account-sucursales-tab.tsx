"use client";

import type { BillingOptionsResponse, BillingPaymentResponse, BranchSummary } from "../customer-account-types";
import { displayStatus, fmtDate, fmtMoney } from "../customer-account-format";
import { PAYMENT_STATUS_LABELS } from "../customer-account-constants";
import { PortalPageHeader } from "../portal-page-header";

export type AccountSucursalesTabProps = {
  branches: BranchSummary[];
  billingLoading: boolean;
  canRequestBranchWithoutPayment: boolean;
  branchUnitPrice: number | null;
  branchFlowStep: 1 | 2 | 3;
  setBranchFlowStep: (step: 1 | 2 | 3) => void;
  isProjectedCapacityInvalid: boolean;
  setBillingError: (msg: string) => void;
  billingOptions: BillingOptionsResponse | null;
  activeBranchesCount: number;
  billingError: string | null;
  billingOk: string | null;
  branchRequestName: string;
  setBranchRequestName: (v: string) => void;
  expansionBranchName: string;
  setExpansionBranchName: (v: string) => void;
  branchRequestAddress: string;
  setBranchRequestAddress: (v: string) => void;
  expansionBranchAddress: string;
  setExpansionBranchAddress: (v: string) => void;
  expansionQty: string;
  setExpansionQty: (v: string) => void;
  expansionMonths: string;
  setExpansionMonths: (v: string) => void;
  expansionMethodSlug: string;
  setExpansionMethodSlug: (v: string) => void;
  projectedActiveBranches: number;
  projectedEffectiveMaxBranches: number | null | undefined;
  projectedRemainingBranches: number | null | undefined;
  expansionQtyNumber: number;
  expansionMonthsNumber: number;
  expansionAmount: number | null;
  branchRequestNotes: string;
  setBranchRequestNotes: (v: string) => void;
  expansionNotes: string;
  setExpansionNotes: (v: string) => void;
  busy: boolean;
  onBranchRequest: () => void;
  onCreateExpansionPayment: () => void;
  createdExpansionPayment: BillingPaymentResponse | null;
  proofUploading: boolean;
  proofFileUrl: string | null;
  onUploadPaymentProof: (file: File) => void;
  onBranchWizardBack: () => void;
  onBranchWizardNext: () => void;
};

export function AccountSucursalesTab({
  branches,
  billingLoading,
  canRequestBranchWithoutPayment,
  branchUnitPrice,
  branchFlowStep,
  setBranchFlowStep,
  isProjectedCapacityInvalid,
  setBillingError,
  billingOptions,
  activeBranchesCount,
  billingError,
  billingOk,
  branchRequestName,
  setBranchRequestName,
  expansionBranchName,
  setExpansionBranchName,
  branchRequestAddress,
  setBranchRequestAddress,
  expansionBranchAddress,
  setExpansionBranchAddress,
  expansionQty,
  setExpansionQty,
  expansionMonths,
  setExpansionMonths,
  expansionMethodSlug,
  setExpansionMethodSlug,
  projectedActiveBranches,
  projectedEffectiveMaxBranches,
  projectedRemainingBranches,
  expansionQtyNumber,
  expansionMonthsNumber,
  expansionAmount,
  branchRequestNotes,
  setBranchRequestNotes,
  expansionNotes,
  setExpansionNotes,
  busy,
  onBranchRequest,
  onCreateExpansionPayment,
  createdExpansionPayment,
  proofUploading,
  proofFileUrl,
  onUploadPaymentProof,
  onBranchWizardBack,
  onBranchWizardNext,
}: AccountSucursalesTabProps) {
  const stepSegmentClass = (step: 1 | 2 | 3) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${
      branchFlowStep === step
        ? "bg-white text-indigo-800 shadow-sm ring-1 ring-indigo-200/90 dark:bg-zinc-800 dark:text-indigo-200 dark:ring-indigo-500/35"
        : "text-zinc-600 hover:text-indigo-800 dark:text-zinc-400 dark:hover:text-indigo-200"
    }`;

  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Ubicaciones y expansión"
        description="Lista actual y asistente para solicitar más sucursales según el cupo del plan."
      />

      <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Sucursales actuales</h2>
        <div className="mt-3 space-y-2">
          {branches.length === 0 ? (
            <p className="text-sm text-zinc-500">No tienes sucursales registradas.</p>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{branch.name}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{branch.address || "Sin dirección"}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{branch.is_active ? "Activa" : "Inactiva"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Solicitar nueva sucursal</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {billingLoading
            ? "Cargando reglas de expansión..."
            : canRequestBranchWithoutPayment
              ? "Tu plan todavía tiene cupo. Enviaremos la solicitud para crear la sucursal."
              : "Llegaste al límite de sucursales del plan. Debes generar pago de expansión para continuar."}
        </p>

        <div
          className="mt-4 flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-indigo-50/40 p-1 dark:border-zinc-800 dark:bg-indigo-950/25"
          role="tablist"
          aria-label="Pasos de solicitud"
        >
          {(
            [
              [1, "Datos"],
              [2, "Impacto"],
              [3, "Confirmación"],
            ] as const
          ).map(([step, label]) => (
            <button
              key={step}
              type="button"
              role="tab"
              aria-selected={branchFlowStep === step}
              onClick={() => {
                if (step === 3 && isProjectedCapacityInvalid) {
                  setBillingError(
                    "La proyección supera tu capacidad disponible. Ajusta la cantidad antes de continuar."
                  );
                  return;
                }
                setBranchFlowStep(step);
              }}
              className={stepSegmentClass(step)}
            >
              {step}. {label}
            </button>
          ))}
        </div>

        {!billingLoading && !canRequestBranchWithoutPayment ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Precio base por sucursal extra: {fmtMoney(branchUnitPrice)} / mes. Si tu plan vence pronto, el primer cobro se
            prorratea y el extra queda alineado al vencimiento del plan.
          </p>
        ) : null}

        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Capacidad actual</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {activeBranchesCount} activas
            {billingOptions?.maxBranches != null ? ` de ${billingOptions.maxBranches} incluidas` : " (plan sin límite)"}
          </p>
          {typeof billingOptions?.extraBranchEntitlements === "number" && billingOptions.extraBranchEntitlements > 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              + {billingOptions.extraBranchEntitlements} extra(s) compradas · capacidad efectiva:{" "}
              {billingOptions.effectiveMaxBranches ?? "sin límite"}
            </p>
          ) : null}
        </div>

        {billingError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {billingError}
          </div>
        ) : null}

        {billingOk ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {billingOk}
          </div>
        ) : null}

        <div className="mt-3 space-y-3">
          {branchFlowStep === 1 ? (
            <>
              <input
                value={canRequestBranchWithoutPayment ? branchRequestName : expansionBranchName}
                onChange={(event) =>
                  canRequestBranchWithoutPayment
                    ? setBranchRequestName(event.target.value)
                    : setExpansionBranchName(event.target.value)
                }
                placeholder="Nombre de la sucursal"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                value={canRequestBranchWithoutPayment ? branchRequestAddress : expansionBranchAddress}
                onChange={(event) =>
                  canRequestBranchWithoutPayment
                    ? setBranchRequestAddress(event.target.value)
                    : setExpansionBranchAddress(event.target.value)
                }
                placeholder="Dirección estimada"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </>
          ) : null}

          {branchFlowStep === 2 ? (
            <>
              {!canRequestBranchWithoutPayment ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    type="number"
                    min={1}
                    value={expansionQty}
                    onChange={(event) => setExpansionQty(event.target.value)}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Cantidad"
                  />
                  <input
                    type="number"
                    min={1}
                    value={expansionMonths}
                    onChange={(event) => setExpansionMonths(event.target.value)}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Meses"
                  />
                  <select
                    value={expansionMethodSlug}
                    onChange={(event) => setExpansionMethodSlug(event.target.value)}
                    aria-label="Método de pago"
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {billingOptions?.paymentMethods.map((method) => (
                      <option key={method.id} value={method.slug}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="text-xs text-zinc-500">Capacidad actual</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {activeBranchesCount} activas / {billingOptions?.effectiveMaxBranches ?? "sin límite"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="text-xs text-zinc-500">Capacidad proyectada</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {projectedActiveBranches} activas / {projectedEffectiveMaxBranches ?? "sin límite"}
                  </p>
                  <p
                    className={`text-xs ${projectedRemainingBranches != null && projectedRemainingBranches < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    Cupo restante: {projectedRemainingBranches ?? "sin límite"}
                  </p>
                </div>
              </div>

              {isProjectedCapacityInvalid ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  La proyección queda por debajo de 0 cupos. Incrementa la cantidad de expansión para continuar.
                </p>
              ) : null}

              {!canRequestBranchWithoutPayment ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Resumen de cobro proyectado</p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {fmtMoney(branchUnitPrice)} x {expansionQtyNumber} x {expansionMonthsNumber} = {fmtMoney(expansionAmount)}
                  </p>
                  {typeof billingOptions?.daysUntilPlanEnd === "number" && billingOptions.daysUntilPlanEnd > 0 ? (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Días hasta vencimiento del plan: {billingOptions.daysUntilPlanEnd}. El total final puede prorratearse
                      en el primer ciclo.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {branchFlowStep === 3 ? (
            <>
              <textarea
                value={canRequestBranchWithoutPayment ? branchRequestNotes : expansionNotes}
                onChange={(event) =>
                  canRequestBranchWithoutPayment
                    ? setBranchRequestNotes(event.target.value)
                    : setExpansionNotes(event.target.value)
                }
                placeholder="Notas para soporte/facturación"
                className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />

              {canRequestBranchWithoutPayment ? (
                <button
                  type="button"
                  onClick={onBranchRequest}
                  disabled={busy || billingLoading}
                  className="h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
                >
                  {busy ? "Enviando..." : "Enviar solicitud de sucursal"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCreateExpansionPayment}
                  disabled={busy || billingLoading || !billingOptions?.paymentMethods.length}
                  className="h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
                >
                  {busy ? "Creando orden..." : "Generar orden de pago"}
                </button>
              )}

              {createdExpansionPayment ? (
                <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Referencia</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {createdExpansionPayment.payment.payment_reference}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Estado: {displayStatus(createdExpansionPayment.payment.status ?? "pending", PAYMENT_STATUS_LABELS)}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Total cobrado: {fmtMoney(createdExpansionPayment.instructions.summary.amount)}
                    </p>
                    {typeof createdExpansionPayment.instructions.summary.firstCycleFactor === "number" &&
                    typeof createdExpansionPayment.instructions.summary.effectiveMonths === "number" ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Prorrateo primer ciclo: {createdExpansionPayment.instructions.summary.firstCycleFactor.toFixed(3)} ·
                        meses efectivos: {createdExpansionPayment.instructions.summary.effectiveMonths.toFixed(3)}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm dark:border-indigo-900/50 dark:bg-zinc-900/70">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {createdExpansionPayment.instructions.method.name}
                    </p>
                    {Object.entries(createdExpansionPayment.instructions.method.config).length === 0 ? (
                      <p className="text-zinc-600 dark:text-zinc-400">Sin instrucciones adicionales.</p>
                    ) : (
                      Object.entries(createdExpansionPayment.instructions.method.config).map(([key, value]) => (
                        <p key={key} className="text-zinc-600 dark:text-zinc-400">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{key}:</span> {value}
                        </p>
                      ))
                    )}
                  </div>

                  {createdExpansionPayment.instructions.summary.requiresManualProof ? (
                    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/70">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Cargar comprobante</p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        aria-label="Cargar comprobante de pago"
                        title="Cargar comprobante de pago"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void onUploadPaymentProof(file);
                          }
                        }}
                        className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-indigo-500 dark:text-zinc-300"
                      />
                      {proofUploading ? <p className="text-xs text-zinc-500">Subiendo comprobante...</p> : null}
                      {proofFileUrl ? (
                        <a
                          href={proofFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Ver comprobante cargado
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <button
              type="button"
              onClick={onBranchWizardBack}
              disabled={branchFlowStep === 1}
              className="h-10 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={onBranchWizardNext}
              disabled={branchFlowStep === 3 || (branchFlowStep === 2 && isProjectedCapacityInvalid)}
              className="h-10 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
