import {
  ADDON_STATUS_LABELS,
  BRANCH_ENTITLEMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "./customer-account-constants";

/** Formato UTC determinista (evita diferencias servidor/cliente en hidratación). */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${day}-${month}-${year}, ${hours}:${minutes} UTC`;
}

export function formatPaymentConfigKey(key: string): string {
  const normalized = String(key ?? "").trim().replace(/[_-]+/g, " ");
  if (!normalized) return "Dato";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function fmtMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "-";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * Etiqueta legible para valores de estado (claves en minúsculas).
 * Misma semántica que el helper histórico del portal.
 */
export function displayStatus(value: string | null | undefined, labels: Record<string, string>): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "Sin estado";
  return labels[normalized] ?? normalized.replace(/_/g, " ");
}

export function subscriptionLabel(status: string | null | undefined): string {
  return displayStatus(status, SUBSCRIPTION_STATUS_LABELS);
}

export function paymentStatusLabel(status: string | null | undefined): string {
  return displayStatus(status, PAYMENT_STATUS_LABELS);
}

export function ticketStatusLabel(status: string | null | undefined): string {
  return displayStatus(status, TICKET_STATUS_LABELS);
}

export function ticketPriorityLabel(priority: string | null | undefined): string {
  return displayStatus(priority, TICKET_PRIORITY_LABELS);
}

export function ticketCategoryLabel(category: string | null | undefined): string {
  return displayStatus(category, TICKET_CATEGORY_LABELS);
}

export function branchEntitlementStatusLabel(status: string | null | undefined): string {
  return displayStatus(status, BRANCH_ENTITLEMENT_STATUS_LABELS);
}

export function addonStatusLabel(status: string | null | undefined): string {
  return displayStatus(status, ADDON_STATUS_LABELS);
}
