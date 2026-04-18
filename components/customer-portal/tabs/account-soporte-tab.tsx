"use client";

import type { CompanySnapshot, TicketMessage, TicketSummary } from "../customer-account-types";
import { fmtDate } from "../customer-account-format";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "../customer-account-constants";
import { getTicketAgeHours, getTicketSlaHours } from "../customer-account-ticket-utils";
import { PortalPageHeader } from "../portal-page-header";

export type SupportCategory = "general" | "billing" | "technical" | "product" | "account";
export type SupportPriority = "low" | "medium" | "high" | "critical";

export type AccountSoporteTabProps = {
  company: CompanySnapshot;
  busy: boolean;
  supportSubject: string;
  setSupportSubject: (v: string) => void;
  supportCategory: SupportCategory;
  setSupportCategory: (v: SupportCategory) => void;
  supportPriority: SupportPriority;
  setSupportPriority: (v: SupportPriority) => void;
  supportDescription: string;
  setSupportDescription: (v: string) => void;
  onSupportTicket: () => void;
  onApplySupportTemplate: (kind: "facturacion" | "tecnico" | "sucursales") => void;
  tickets: TicketSummary[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  selectedTicket: TicketSummary | null;
  messageLoading: boolean;
  messages: TicketMessage[];
  messageDraft: string;
  setMessageDraft: (v: string) => void;
  onSendMessage: () => void;
};

export function AccountSoporteTab({
  company,
  busy,
  supportSubject,
  setSupportSubject,
  supportCategory,
  setSupportCategory,
  supportPriority,
  setSupportPriority,
  supportDescription,
  setSupportDescription,
  onSupportTicket,
  onApplySupportTemplate,
  tickets,
  selectedTicketId,
  onSelectTicket,
  selectedTicket,
  messageLoading,
  messages,
  messageDraft,
  setMessageDraft,
  onSendMessage,
}: AccountSoporteTabProps) {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Tickets y mensajes"
        description="Crea un caso nuevo o sigue el hilo con el equipo desde la columna derecha."
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Crear ticket</h2>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Plantilla rápida
            <select
              defaultValue=""
              aria-label="Aplicar plantilla de ticket"
              onChange={(event) => {
                const v = event.target.value as "" | "facturacion" | "tecnico" | "sucursales";
                if (v) onApplySupportTemplate(v);
                event.target.value = "";
              }}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Elegir plantilla…</option>
              <option value="facturacion">Facturación y cobros</option>
              <option value="tecnico">Incidencia técnica</option>
              <option value="sucursales">Sucursales y expansión</option>
            </select>
          </label>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Rellena asunto y descripción con un texto base; puedes editarlo antes de enviar.
          </p>
          <div className="mt-4 max-w-xl space-y-2">
            <input
              value={supportSubject}
              onChange={(event) => setSupportSubject(event.target.value)}
              placeholder="Asunto"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={supportCategory}
                onChange={(event) => setSupportCategory(event.target.value as SupportCategory)}
                aria-label="Categoría del ticket"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="general">{TICKET_CATEGORY_LABELS.general}</option>
                <option value="billing">{TICKET_CATEGORY_LABELS.billing}</option>
                <option value="technical">{TICKET_CATEGORY_LABELS.technical}</option>
                <option value="product">{TICKET_CATEGORY_LABELS.product}</option>
                <option value="account">{TICKET_CATEGORY_LABELS.account}</option>
              </select>
              <select
                value={supportPriority}
                onChange={(event) => setSupportPriority(event.target.value as SupportPriority)}
                aria-label="Prioridad del ticket"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="low">{TICKET_PRIORITY_LABELS.low}</option>
                <option value="medium">{TICKET_PRIORITY_LABELS.medium}</option>
                <option value="high">{TICKET_PRIORITY_LABELS.high}</option>
                <option value="critical">{TICKET_PRIORITY_LABELS.critical}</option>
              </select>
            </div>
            <textarea
              value={supportDescription}
              onChange={(event) => setSupportDescription(event.target.value)}
              placeholder="Describe el problema o solicitud"
              className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={onSupportTicket}
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Enviando..." : "Crear ticket"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mis tickets</h3>
          <div className="mt-3 space-y-2">
            {tickets.length === 0 ? (
              <p className="text-sm text-zinc-500">No tienes tickets aún.</p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedTicketId === ticket.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.subject}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} · {fmtDate(ticket.lastMessageAt, company.timezone)}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    SLA objetivo: {getTicketSlaHours(ticket.priority)}h · Prioridad{" "}
                    {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Conversación</h3>
        {!selectedTicket ? (
          <p className="mt-3 text-sm text-zinc-500">Selecciona un ticket para ver y responder mensajes.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/60">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTicket.subject}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{selectedTicket.description}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                SLA objetivo: {getTicketSlaHours(selectedTicket.priority)}h · antigüedad aproximada:{" "}
                {(() => {
                  const ageHours = getTicketAgeHours(selectedTicket.createdAt);
                  if (ageHours == null) return "-";
                  if (ageHours < 24) return `${Math.max(1, Math.floor(ageHours))}h`;
                  return `${Math.floor(ageHours / 24)}d`;
                })()}
              </p>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              {messageLoading ? (
                <p className="text-sm text-zinc-500">Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin mensajes adicionales.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      message.author_type === "tenant"
                        ? "ml-6 bg-indigo-50 text-zinc-800 dark:bg-indigo-950/30 dark:text-zinc-100"
                        : "mr-6 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    <p>{message.message}</p>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(message.created_at, company.timezone)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Escribe una respuesta..."
                className="min-h-20 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={onSendMessage}
                disabled={messageLoading || !messageDraft.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                Enviar mensaje
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
    </div>
  );
}
