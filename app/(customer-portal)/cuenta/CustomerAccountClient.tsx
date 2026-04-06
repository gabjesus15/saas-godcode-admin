"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Rocket,
  Store,
} from "lucide-react";

import { SaasLogo } from "../../../components/super-admin/SaasLogo";
import { uploadImage } from "../../../components/tenant/utils/cloudinary";

type PlanOption = {
  id: string;
  name: string;
  price: number | null;
  max_branches: number | null;
  max_users: number | null;
};

type AddonOption = {
  id: string;
  name: string;
  type: string | null;
  price_monthly: number | null;
  price_one_time: number | null;
};

type BranchSummary = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean | null;
};

type PaymentSummary = {
  id: string;
  amount_paid: number | null;
  status: string | null;
  payment_date: string | null;
  payment_method: string | null;
  months_paid: number | null;
  payment_reference: string | null;
  reference_file_url: string | null;
};

type TicketSummary = {
  id: string;
  subject: string;
  description: string;
  category: "general" | "billing" | "technical" | "product" | "account";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  author_type: "tenant" | "super_admin" | "system";
  author_email: string | null;
  is_internal: boolean;
  message: string;
  created_at: string;
};

type ActiveAddon = {
  id: string;
  addonId: string;
  addonSlug: string;
  addonType: string;
  status: string;
  expires_at: string | null;
  addonName: string;
};

type BranchEntitlementSummary = {
  id: string;
  quantity: number;
  monthsPurchased: number;
  amountPaid: number;
  unitPrice: number;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  paymentReference: string | null;
};

type AccountActivityItem = {
  id: string;
  type: "pago" | "ticket" | "extra";
  title: string;
  detail: string;
  status: string;
  occurredAt: string;
  amount?: number | null;
};

type CompanySnapshot = {
  id: string;
  name: string;
  publicSlug: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  planName: string | null;
  planPrice: number | null;
  planMaxBranches: number | null;
  planMaxUsers: number | null;
  supportEmail: string;
  tenantAdminUrl: string | null;
};

type CustomerAccountClientProps = {
  company: CompanySnapshot;
  branches: BranchSummary[];
  payments: PaymentSummary[];
  activeAddons: ActiveAddon[];
  availablePlans: PlanOption[];
  availableAddons: AddonOption[];
  initialTickets: TicketSummary[];
  initialBranchEntitlements: BranchEntitlementSummary[];
};

type BillingMethodOption = {
  id: string;
  slug: string;
  name: string;
  auto_verify: boolean;
  config: Record<string, string>;
};

type BillingOptionsResponse = {
  companyId: string;
  activeBranchCount: number;
  maxBranches: number | null;
  extraBranchEntitlements?: number;
  effectiveMaxBranches?: number | null;
  requiresPaymentForExpansion: boolean;
  branchExpansionPriceMonthly: number;
  coTermWithSubscription?: boolean;
  daysUntilPlanEnd?: number | null;
  paymentMethods: BillingMethodOption[];
};

type BillingPaymentResponse = {
  ok: boolean;
  payment: {
    id: string;
    amount_paid: number;
    months_paid: number;
    payment_reference: string;
    status: string | null;
    payment_method: string | null;
    payment_method_slug: string | null;
    payment_date: string | null;
    reference_file_url: string | null;
  };
  instructions: {
    method: {
      slug: string;
      name: string;
      config: Record<string, string>;
    };
    summary: {
      unitPrice: number;
      quantity: number;
      months: number;
      firstCycleFactor?: number;
      effectiveMonths?: number;
      coTermWithSubscription?: boolean;
      daysUntilPlanEnd?: number | null;
      amount: number;
      requiresManualProof: boolean;
    };
  };
};

type PlanChangePreview = {
  company: {
    id: string;
    name: string;
    plan_id: string | null;
  };
  currentPlan: {
    id: string;
    name: string;
    price: number | null;
    max_branches: number | null;
    max_users: number | null;
  } | null;
  targetPlan: {
    id: string;
    name: string;
    price: number | null;
    max_branches: number | null;
    max_users: number | null;
  };
  counts: {
    activeBranches: number;
    activeUsers: number;
    activeExtraBranchEntitlements: number;
    targetEffectiveBranches: number | null;
  };
  pricing: {
    currentPrice: number;
    targetPrice: number;
    monthlyDiff: number;
    months: number;
    amountDue: number;
    requiresPayment: boolean;
  };
  impacts: Array<{
    id: string;
    level: "warn" | "block";
    title: string;
    detail: string;
  }>;
  paymentMethods: Array<{
    id: string;
    slug: string;
    name: string;
    auto_verify: boolean;
    config: Record<string, string>;
  }>;
};

type AddonPurchasePreview = {
  company: {
    id: string;
    name: string;
    country: string | null;
    plan_id: string | null;
    subscription_ends_at: string | null;
  };
  addon: {
    id: string;
    slug: string;
    name: string;
    type: string | null;
    description: string | null;
    price_one_time: number | null;
    price_monthly: number | null;
  };
  existingActive: boolean;
  singleInstance: boolean;
  pricing: {
    isMonthly: boolean;
    unitPrice: number;
    quantity: number;
    months: number;
    amountDue: number;
    requiresPayment: boolean;
  };
  impacts: Array<{
    id: string;
    level: "warn" | "block";
    title: string;
    detail: string;
  }>;
  paymentMethods: Array<{
    id: string;
    slug: string;
    name: string;
    auto_verify: boolean;
    config: Record<string, string>;
  }>;
};

type RealtimeSnapshotResponse = {
  payments: PaymentSummary[];
  tickets: TicketSummary[];
  branchEntitlements: BranchEntitlementSummary[];
  activeAddons: Array<{
    id: string;
    status: string;
    expires_at: string | null;
    addon_id: string | null;
    slug: string | null;
    name: string | null;
    type: string | null;
  }>;
};

type PortalTab = "resumen" | "plan" | "sucursales" | "facturacion" | "soporte";

const TAB_LABELS: Record<PortalTab, string> = {
  resumen: "Resumen",
  plan: "Plan y extras",
  sucursales: "Sucursales",
  facturacion: "Facturacion",
  soporte: "Soporte",
};

const TAB_ICONS: Record<PortalTab, React.ComponentType<{ className?: string }>> = {
  resumen: LayoutDashboard,
  plan: CreditCard,
  sucursales: Store,
  facturacion: FileText,
  soporte: LifeBuoy,
};

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  waiting_customer: "Esperando cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  pending: "Pendiente",
  trialing: "Prueba",
  past_due: "Vencida",
  cancelled: "Cancelada",
  paused: "Pausada",
  suspended: "Suspendida",
};

const ADDON_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  inactive: "Inactivo",
  expired: "Vencido",
  cancelled: "Cancelado",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  pending_validation: "Pendiente de validacion",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const SUPPORT_CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  billing: "Facturacion",
  technical: "Tecnico",
  product: "Producto",
  account: "Cuenta",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

function toDisplayLabel(value: string | null | undefined, labels: Record<string, string>): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "Sin estado";
  return labels[normalized] ?? normalized.replace(/_/g, " ");
}

function normalizeAddonIdentity(input: { id?: string | null; name?: string | null; slug?: string | null; type?: string | null }): string {
  return `${String(input.id ?? "").trim().toLowerCase()}|${String(input.slug ?? "").trim().toLowerCase()}|${String(input.type ?? "").trim().toLowerCase()}|${String(input.name ?? "").trim().toLowerCase()}`;
}

function isSingleInstanceAddon(input: { name?: string | null; slug?: string | null; type?: string | null }): boolean {
  const haystack = `${String(input.name ?? "")} ${String(input.slug ?? "")} ${String(input.type ?? "")}`.toLowerCase();
  if (!haystack) return false;
  return haystack.includes("dominio") || haystack.includes("domain") || haystack.includes("custom_domain") || haystack.includes("custom-domain");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  // Deterministic UTC formatting avoids server/client locale drift during hydration.
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${day}-${month}-${year}, ${hours}:${minutes} UTC`;
}

function fmtMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "-";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getTicketSlaHours(priority: TicketSummary["priority"]): number {
  if (priority === "critical") return 2;
  if (priority === "high") return 6;
  if (priority === "medium") return 12;
  return 24;
}

function getTicketAgeHours(iso: string): number | null {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, (Date.now() - ms) / (1000 * 60 * 60));
}

async function postTicket(payload: {
  subject: string;
  description: string;
  category: "general" | "billing" | "technical" | "product" | "account";
  priority: "low" | "medium" | "high" | "critical";
}): Promise<{ ok: boolean; error?: string; ticket?: TicketSummary }> {
  const res = await fetch("/api/tenant-tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    ticket?: TicketSummary;
  };

  if (!res.ok) {
    return { ok: false, error: data.error || "No se pudo crear la solicitud." };
  }

  return { ok: true, ticket: data.ticket };
}

export function CustomerAccountClient(props: CustomerAccountClientProps) {
  const { company, branches, payments, activeAddons, availablePlans, availableAddons, initialTickets, initialBranchEntitlements } = props;

  const [tab, setTab] = useState<PortalTab>("resumen");
  const [tickets, setTickets] = useState<TicketSummary[]>(initialTickets);
  const [paymentRows, setPaymentRows] = useState<PaymentSummary[]>(payments);
  const [branchEntitlements, setBranchEntitlements] = useState<BranchEntitlementSummary[]>(initialBranchEntitlements);
  const [activeAddonRows, setActiveAddonRows] = useState<ActiveAddon[]>(activeAddons);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketOk, setTicketOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [targetPlanId, setTargetPlanId] = useState(availablePlans[0]?.id ?? "");
  const [planMonths, setPlanMonths] = useState("1");
  const [planMethodSlug, setPlanMethodSlug] = useState("");
  const [planReason, setPlanReason] = useState("");
  const [planPreview, setPlanPreview] = useState<PlanChangePreview | null>(null);
  const [planPreviewLoading, setPlanPreviewLoading] = useState(false);
  const [planChangeBusy, setPlanChangeBusy] = useState(false);
  const [acknowledgedImpactIds, setAcknowledgedImpactIds] = useState<string[]>([]);

  const [targetAddonId, setTargetAddonId] = useState(availableAddons[0]?.id ?? "");
  const [addonQty, setAddonQty] = useState("1");
  const [addonMonths, setAddonMonths] = useState("1");
  const [addonMethodSlug, setAddonMethodSlug] = useState("");
  const [addonNotes, setAddonNotes] = useState("");
  const [addonPreview, setAddonPreview] = useState<AddonPurchasePreview | null>(null);
  const [addonPreviewLoading, setAddonPreviewLoading] = useState(false);
  const [addonPurchaseBusy, setAddonPurchaseBusy] = useState(false);
  const [acknowledgedAddonImpactIds, setAcknowledgedAddonImpactIds] = useState<string[]>([]);

  const [branchRequestName, setBranchRequestName] = useState("");
  const [branchRequestAddress, setBranchRequestAddress] = useState("");
  const [branchRequestNotes, setBranchRequestNotes] = useState("");

  const [billingOptions, setBillingOptions] = useState<BillingOptionsResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingOk, setBillingOk] = useState<string | null>(null);

  const [expansionQty, setExpansionQty] = useState("1");
  const [expansionMonths, setExpansionMonths] = useState("1");
  const [expansionMethodSlug, setExpansionMethodSlug] = useState("");
  const [expansionNotes, setExpansionNotes] = useState("");
  const [expansionBranchName, setExpansionBranchName] = useState("");
  const [expansionBranchAddress, setExpansionBranchAddress] = useState("");
  const [branchFlowStep, setBranchFlowStep] = useState<1 | 2 | 3>(1);

  const [createdExpansionPayment, setCreatedExpansionPayment] = useState<BillingPaymentResponse | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofFileUrl, setProofFileUrl] = useState("");

  const [supportSubject, setSupportSubject] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportCategory, setSupportCategory] = useState<"general" | "billing" | "technical" | "product" | "account">("general");
  const [supportPriority, setSupportPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [activityFilter, setActivityFilter] = useState<"all" | "pago" | "ticket" | "extra">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentReferenceQuery, setPaymentReferenceQuery] = useState<string>("");
  const [paymentDateFrom, setPaymentDateFrom] = useState<string>("");
  const [paymentDateTo, setPaymentDateTo] = useState<string>("");

  const [selectedTicketId, setSelectedTicketId] = useState<string>(initialTickets[0]?.id ?? "");
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [lastRealtimeSyncAt, setLastRealtimeSyncAt] = useState<string | null>(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const expiryDays = daysUntil(company.subscriptionEndsAt);
  const activeBranchesCount = billingOptions?.activeBranchCount ?? branches.filter((branch) => branch.is_active !== false).length;
  const openTicketsCount = tickets.filter((ticket) => ["open", "in_progress", "waiting_customer"].includes(ticket.status)).length;
  const latestPayment = paymentRows[0] ?? null;
  const canRequestBranchWithoutPayment =
    billingOptions?.requiresPaymentForExpansion === false ||
    (billingOptions?.maxBranches != null && activeBranchesCount < billingOptions.maxBranches);

  const branchUnitPrice = billingOptions?.branchExpansionPriceMonthly ?? 0;
  const expansionQtyNumber = Math.max(1, Number.parseInt(expansionQty, 10) || 1);
  const expansionMonthsNumber = Math.max(1, Number.parseInt(expansionMonths, 10) || 1);
  const expansionAmount = Number((branchUnitPrice * expansionQtyNumber * expansionMonthsNumber).toFixed(2));
  const projectedExtraEntitlements = (billingOptions?.extraBranchEntitlements ?? 0) + (canRequestBranchWithoutPayment ? 0 : expansionQtyNumber);
  const projectedEffectiveMaxBranches =
    billingOptions?.maxBranches == null ? null : billingOptions.maxBranches + projectedExtraEntitlements;
  const projectedActiveBranches = activeBranchesCount + 1;
  const projectedRemainingBranches =
    projectedEffectiveMaxBranches == null ? null : projectedEffectiveMaxBranches - projectedActiveBranches;
  const isProjectedCapacityInvalid = projectedRemainingBranches != null && projectedRemainingBranches < 0;
  const selectedPlanOption = useMemo(
    () => availablePlans.find((plan) => plan.id === targetPlanId) ?? null,
    [availablePlans, targetPlanId]
  );
  const planMonthsNumber = Math.max(1, Math.min(24, Number.parseInt(planMonths, 10) || 1));
  const selectedAddonOption = useMemo(
    () => availableAddons.find((addon) => addon.id === targetAddonId) ?? null,
    [availableAddons, targetAddonId]
  );
  const ownedAddonKeys = useMemo(() => {
    return new Set(
      activeAddonRows
        .filter((addon) => String(addon.status ?? "").toLowerCase() === "active")
        .map((addon) =>
          normalizeAddonIdentity({
            id: addon.addonId,
            slug: addon.addonSlug,
            type: addon.addonType,
            name: addon.addonName,
          })
        )
    );
  }, [activeAddonRows]);
  const selectedAddonOwned =
    selectedAddonOption != null &&
    ownedAddonKeys.has(
      normalizeAddonIdentity({
        id: selectedAddonOption.id,
        name: selectedAddonOption.name,
        type: selectedAddonOption.type,
      })
    );
  const selectedAddonSingleInstance = isSingleInstanceAddon(selectedAddonOption ?? {});
  const selectedAddonEffectiveQty = selectedAddonSingleInstance ? 1 : Math.max(1, Number.parseInt(addonQty, 10) || 1);
  const addonMonthsNumber = Math.max(1, Math.min(24, Number.parseInt(addonMonths, 10) || 1));
  const selectedAddonIsMonthly =
    addonPreview?.pricing.isMonthly ??
    (selectedAddonOption != null && Number(selectedAddonOption.price_monthly ?? 0) > 0);
  const selectedAddonModeLabel = selectedAddonIsMonthly ? "Mensual co-terminado" : "Pago unico";
  const addonEstimatedUnit = selectedAddonOption?.price_monthly ?? selectedAddonOption?.price_one_time ?? null;
  const addonEstimatedTotal = addonEstimatedUnit != null
    ? addonEstimatedUnit * selectedAddonEffectiveQty * (selectedAddonOption?.price_monthly ? addonMonthsNumber : 1)
    : null;

  useEffect(() => {
    if (selectedAddonSingleInstance && addonQty !== "1") {
      setAddonQty("1");
    }
  }, [selectedAddonSingleInstance, addonQty]);

  const pendingPaymentsCount = paymentRows.filter((payment) => {
    const status = String(payment.status ?? "").toLowerCase();
    return status === "pending" || status === "pending_validation";
  }).length;

  const showTicketFeedback = tab === "plan" || tab === "sucursales" || tab === "soporte";

  const activeEntitlementsCount = branchEntitlements.filter((entitlement) => String(entitlement.status).toLowerCase() === "active").length;

  const accountAlerts = useMemo(() => {
    const alerts: Array<{ id: string; tone: "warn" | "info" | "ok"; title: string; description: string }> = [];

    if (expiryDays != null && expiryDays <= 7) {
      alerts.push({
        id: "subscription-expiry",
        tone: expiryDays <= 0 ? "warn" : "info",
        title: expiryDays <= 0 ? "Tu plan esta vencido" : "Tu plan vence pronto",
        description:
          expiryDays <= 0
            ? "Regulariza tu suscripcion para evitar interrupciones en tus modulos activos."
            : `Te quedan ${expiryDays} dia${expiryDays === 1 ? "" : "s"}. Revisa facturacion para evitar cortes.`,
      });
    }

    if (pendingPaymentsCount > 0) {
      alerts.push({
        id: "pending-payments",
        tone: "info",
        title: "Tienes pagos pendientes de validacion",
        description: `${pendingPaymentsCount} pago${pendingPaymentsCount === 1 ? "" : "s"} requiere${pendingPaymentsCount === 1 ? "" : "n"} seguimiento.`,
      });
    }

    if (billingOptions?.effectiveMaxBranches != null) {
      const remaining = billingOptions.effectiveMaxBranches - activeBranchesCount;
      if (remaining <= 1) {
        alerts.push({
          id: "branch-capacity",
          tone: remaining <= 0 ? "warn" : "info",
          title: remaining <= 0 ? "Llegaste al limite de sucursales" : "Te queda poco cupo de sucursales",
          description:
            remaining <= 0
              ? "Para agregar una nueva sucursal debes comprar expansion desde esta misma cuenta."
              : `Te queda ${remaining} cupo disponible antes de requerir expansion.`,
        });
      }
    }

    if (alerts.length === 0) {
      alerts.push({
        id: "all-good",
        tone: "ok",
        title: "Tu cuenta esta al dia",
        description: "No hay alertas criticas por ahora.",
      });
    }

    return alerts;
  }, [expiryDays, pendingPaymentsCount, billingOptions?.effectiveMaxBranches, activeBranchesCount]);

  const activityTimeline = useMemo(() => {
    const paymentItems: AccountActivityItem[] = paymentRows.map((payment) => ({
      id: `p-${payment.id}`,
      type: "pago",
      title: `Pago ${payment.payment_reference ?? "sin referencia"}`,
      detail: `${fmtMoney(payment.amount_paid)} · ${toDisplayLabel(payment.status, PAYMENT_STATUS_LABELS)}`,
      status: String(payment.status ?? ""),
      occurredAt: payment.payment_date ?? "",
      amount: payment.amount_paid,
    }));

    const ticketItems: AccountActivityItem[] = tickets.map((ticket) => ({
      id: `t-${ticket.id}`,
      type: "ticket",
      title: ticket.subject,
      detail: `${toDisplayLabel(ticket.status, STATUS_LABELS)} · ${SUPPORT_CATEGORY_LABELS[ticket.category] ?? ticket.category}`,
      status: ticket.status,
      occurredAt: ticket.lastMessageAt || ticket.createdAt,
    }));

    const entitlementItems: AccountActivityItem[] = branchEntitlements.map((entitlement) => ({
      id: `e-${entitlement.id}`,
      type: "extra",
      title: `Compra de ${entitlement.quantity} sucursal(es) extra`,
      detail: `${fmtMoney(entitlement.amountPaid)} · ${toDisplayLabel(entitlement.status, ADDON_STATUS_LABELS)}`,
      status: entitlement.status,
      occurredAt: entitlement.createdAt,
      amount: entitlement.amountPaid,
    }));

    return [...paymentItems, ...ticketItems, ...entitlementItems]
      .filter((item) => item.occurredAt)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 20);
  }, [paymentRows, tickets, branchEntitlements]);

  const filteredActivityTimeline = useMemo(() => {
    if (activityFilter === "all") return activityTimeline;
    return activityTimeline.filter((item) => item.type === activityFilter);
  }, [activityTimeline, activityFilter]);

  const filteredPayments = useMemo(() => {
    return paymentRows.filter((payment) => {
      if (paymentStatusFilter !== "all" && String(payment.status ?? "").toLowerCase() !== paymentStatusFilter) {
        return false;
      }

      if (paymentReferenceQuery.trim()) {
        const needle = paymentReferenceQuery.trim().toLowerCase();
        const ref = String(payment.payment_reference ?? "").toLowerCase();
        if (!ref.includes(needle)) return false;
      }

      const paymentDate = payment.payment_date ? new Date(payment.payment_date) : null;
      if (paymentDateFrom) {
        const from = new Date(`${paymentDateFrom}T00:00:00`);
        if (!paymentDate || paymentDate < from) return false;
      }
      if (paymentDateTo) {
        const to = new Date(`${paymentDateTo}T23:59:59`);
        if (!paymentDate || paymentDate > to) return false;
      }
      return true;
    });
  }, [paymentRows, paymentStatusFilter, paymentDateFrom, paymentDateTo, paymentReferenceQuery]);

  const billingPaidTotal = useMemo(
    () => paymentRows
      .filter((payment) => String(payment.status ?? "").toLowerCase() === "paid")
      .reduce((acc, payment) => acc + (Number(payment.amount_paid ?? 0) || 0), 0),
    [paymentRows]
  );

  const billingPendingTotal = useMemo(
    () => paymentRows
      .filter((payment) => {
        const status = String(payment.status ?? "").toLowerCase();
        return status === "pending" || status === "pending_validation";
      })
      .reduce((acc, payment) => acc + (Number(payment.amount_paid ?? 0) || 0), 0),
    [paymentRows]
  );

  const latestPaidPaymentDate = useMemo(() => {
    const paid = paymentRows.find((payment) => String(payment.status ?? "").toLowerCase() === "paid");
    return paid?.payment_date ?? null;
  }, [paymentRows]);

  const resetFeedback = () => {
    setTicketError(null);
    setTicketOk(null);
  };

  const appendTicket = (ticket?: TicketSummary) => {
    if (!ticket) return;
    setTickets((prev) => [ticket, ...prev.filter((item) => item.id !== ticket.id)]);
    setSelectedTicketId(ticket.id);
    setTab("soporte");
  };

  const resetBillingFeedback = () => {
    setBillingError(null);
    setBillingOk(null);
  };

  const loadBillingOptions = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/customer-account/billing", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as BillingOptionsResponse & { error?: string };

      if (!res.ok) {
        setBillingError(data.error || "No se pudo cargar la configuracion de pagos.");
        return;
      }

      setBillingOptions(data);
      setExpansionMethodSlug((current) => {
        if (current && data.paymentMethods.some((method) => method.slug === current)) return current;
        return data.paymentMethods[0]?.slug ?? "";
      });
    } finally {
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    void loadBillingOptions();
  }, []);

  const loadPlanPreview = useCallback(async () => {
    if (!targetPlanId) {
      setPlanPreview(null);
      return;
    }

    setPlanPreviewLoading(true);
    try {
      const sp = new URLSearchParams({
        targetPlanId,
        months: String(planMonthsNumber),
      });
      const res = await fetch(`/api/customer-account/plan-change?${sp.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; preview?: PlanChangePreview };
      if (!res.ok || !data.preview) {
        setPlanPreview(null);
        if (data.error && !String(data.error).toLowerCase().includes("ya estas en ese plan")) {
          setTicketError(data.error);
        }
        return;
      }
      setPlanPreview(data.preview);
      setAcknowledgedImpactIds([]);
      setPlanMethodSlug((current) => {
        if (current && data.preview?.paymentMethods.some((method) => method.slug === current)) return current;
        return data.preview?.paymentMethods[0]?.slug ?? "";
      });
    } finally {
      setPlanPreviewLoading(false);
    }
  }, [targetPlanId, planMonthsNumber]);

  useEffect(() => {
    void loadPlanPreview();
  }, [loadPlanPreview]);

  const loadAddonPreview = useCallback(async () => {
    if (!targetAddonId) {
      setAddonPreview(null);
      return;
    }

    setAddonPreviewLoading(true);
    try {
      const sp = new URLSearchParams({
        addonId: targetAddonId,
        quantity: String(selectedAddonEffectiveQty),
        months: String(addonMonthsNumber),
      });
      const res = await fetch(`/api/customer-account/addons?${sp.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; preview?: AddonPurchasePreview };
      if (!res.ok || !data.preview) {
        setAddonPreview(null);
        if (data.error) setTicketError(data.error);
        return;
      }

      setAddonPreview(data.preview);
      setAcknowledgedAddonImpactIds([]);
      setAddonMethodSlug((current) => {
        if (current && data.preview?.paymentMethods.some((method) => method.slug === current)) return current;
        return data.preview?.paymentMethods[0]?.slug ?? "";
      });
    } finally {
      setAddonPreviewLoading(false);
    }
  }, [targetAddonId, selectedAddonEffectiveQty, addonMonthsNumber]);

  useEffect(() => {
    void loadAddonPreview();
  }, [loadAddonPreview]);

  const loadRealtimeSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/customer-account/realtime-snapshot", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as Partial<RealtimeSnapshotResponse> & { error?: string };
      if (!res.ok) return;

      if (Array.isArray(data.payments)) {
        setPaymentRows(data.payments);
      }
      if (Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
      if (Array.isArray(data.branchEntitlements)) {
        setBranchEntitlements(data.branchEntitlements);
      }
      if (Array.isArray(data.activeAddons)) {
        setActiveAddonRows(
          data.activeAddons.map((row) => ({
            id: String(row.id ?? ""),
            addonId: String(row.addon_id ?? ""),
            addonSlug: String(row.slug ?? ""),
            addonType: String(row.type ?? ""),
            status: String(row.status ?? "active"),
            expires_at: row.expires_at ?? null,
            addonName: String(row.name ?? "Extra"),
          }))
        );
      }
      setLastRealtimeSyncAt(new Date().toISOString());
    } catch {
      // Silent fail: avoid noisy UI if polling fails transiently.
    }
  }, []);

  useEffect(() => {
    void loadRealtimeSnapshot();
    const id = window.setInterval(() => {
      void loadRealtimeSnapshot();
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadRealtimeSnapshot]);

  const handlePlanRequest = async () => {
    if (!planPreview?.targetPlan?.id) {
      setTicketError("No se pudo preparar el cambio de plan.");
      return;
    }

    const blockingImpacts = planPreview.impacts.filter((impact) => impact.level === "block");
    if (blockingImpacts.length > 0) {
      setTicketError("Este cambio no se puede aplicar aun. Revisa los bloqueos indicados.");
      return;
    }

    const warningIds = planPreview.impacts.filter((impact) => impact.level === "warn").map((impact) => impact.id);
    const allWarningsAccepted = warningIds.every((id) => acknowledgedImpactIds.includes(id));
    if (!allWarningsAccepted) {
      setTicketError("Debes confirmar todos los avisos antes de continuar.");
      return;
    }

    if (planPreview.pricing.requiresPayment && !planMethodSlug) {
      setTicketError("Selecciona un metodo de pago para continuar.");
      return;
    }

    resetFeedback();
    setPlanChangeBusy(true);
    try {
      const res = await fetch("/api/customer-account/plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlanId,
          months: planMonthsNumber,
          methodSlug: planPreview.pricing.requiresPayment ? planMethodSlug : undefined,
          acceptedImpactIds: acknowledgedImpactIds,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        appliedNow?: boolean;
        payment?: { id?: string };
      };

      if (!res.ok) {
        setTicketError(data.error || "No se pudo aplicar el cambio de plan.");
        return;
      }

      if (data.appliedNow) {
        setTicketOk(data.message || "Plan actualizado correctamente.");
      } else {
        setTicketOk(data.message || "Pago creado. El cambio se aplicara cuando validemos el pago.");
      }

      setPlanReason("");
      await loadPlanPreview();
      await loadRealtimeSnapshot();
    } finally {
      setPlanChangeBusy(false);
    }
  };

  const handleAddonRequest = async () => {
    if (!addonPreview?.addon?.id) {
      setTicketError("No se pudo preparar la compra del extra.");
      return;
    }

    const blockingImpacts = addonPreview.impacts.filter((impact) => impact.level === "block");
    if (blockingImpacts.length > 0) {
      setTicketError("Este extra no se puede comprar ahora. Revisa los bloqueos indicados.");
      return;
    }

    const warningIds = addonPreview.impacts.filter((impact) => impact.level === "warn").map((impact) => impact.id);
    const allWarningsAccepted = warningIds.every((id) => acknowledgedAddonImpactIds.includes(id));
    if (!allWarningsAccepted) {
      setTicketError("Debes confirmar todos los avisos antes de continuar.");
      return;
    }

    if (addonPreview.pricing.requiresPayment && !addonMethodSlug) {
      setTicketError("Selecciona un metodo de pago para continuar.");
      return;
    }

    resetFeedback();
    setAddonPurchaseBusy(true);
    try {
      const res = await fetch("/api/customer-account/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addonId: targetAddonId,
          quantity: selectedAddonEffectiveQty,
          months: addonMonthsNumber,
          methodSlug: addonPreview.pricing.requiresPayment ? addonMethodSlug : undefined,
          notes: addonNotes.trim() || undefined,
          acceptedImpactIds: acknowledgedAddonImpactIds,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        appliedNow?: boolean;
      };

      if (!res.ok) {
        setTicketError(data.error || "No se pudo procesar la compra del extra.");
        return;
      }

      setTicketOk(
        data.message ||
          (data.appliedNow
            ? "Extra activado correctamente."
            : "Pago creado. El extra se activara cuando validemos el pago.")
      );
      setAddonNotes("");
      setAddonQty("1");
      setAddonMonths("1");
      await loadAddonPreview();
      await loadRealtimeSnapshot();
    } finally {
      setAddonPurchaseBusy(false);
    }
  };

  const handleBranchWizardNext = () => {
    const branchName = canRequestBranchWithoutPayment ? branchRequestName.trim() : expansionBranchName.trim();
    if (branchFlowStep === 1 && !branchName) {
      setTicketError("Indica el nombre de la sucursal antes de continuar.");
      return;
    }

    if (branchFlowStep === 2 && isProjectedCapacityInvalid) {
      setBillingError("La proyeccion supera tu capacidad disponible. Ajusta la cantidad antes de continuar.");
      return;
    }

    if (branchFlowStep === 2 && !canRequestBranchWithoutPayment && !expansionMethodSlug) {
      setBillingError("Selecciona un metodo de pago para continuar.");
      return;
    }

    setTicketError(null);
    setBillingError(null);
    setBranchFlowStep((prev) => (prev >= 3 ? 3 : ((prev + 1) as 1 | 2 | 3)));
  };

  const handleBranchWizardBack = () => {
    setBranchFlowStep((prev) => (prev <= 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));
  };

  const handleBranchRequest = async () => {
    if (!branchRequestName.trim()) {
      setTicketError("Indica nombre de la sucursal.");
      return;
    }

    resetFeedback();
    setBusy(true);

    const description = [
      `Empresa: ${company.name}`,
      `Nombre sucursal: ${branchRequestName.trim()}`,
      `Direccion: ${branchRequestAddress.trim() || "Sin direccion"}`,
      `Detalle: ${branchRequestNotes.trim() || "Sin detalle"}`,
    ].join("\n");

    const result = await postTicket({
      subject: `Solicitud de nueva sucursal -> ${branchRequestName.trim()}`,
      description,
      category: "account",
      priority: "medium",
    });

    setBusy(false);
    if (!result.ok) {
      setTicketError(result.error || "No se pudo enviar la solicitud.");
      return;
    }

    appendTicket(result.ticket);
    setBranchRequestName("");
    setBranchRequestAddress("");
    setBranchRequestNotes("");
    setBranchFlowStep(1);
    setTicketOk("Solicitud de sucursal enviada.");
  };

  const handleCreateExpansionPayment = async () => {
    if (!expansionBranchName.trim()) {
      setBillingError("Indica el nombre de la nueva sucursal.");
      return;
    }
    if (!expansionMethodSlug) {
      setBillingError("Selecciona un metodo de pago.");
      return;
    }

    resetBillingFeedback();
    setBusy(true);

    try {
      const res = await fetch("/api/customer-account/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: expansionQtyNumber,
          months: expansionMonthsNumber,
          methodSlug: expansionMethodSlug,
          notes: expansionNotes.trim() || undefined,
          branchName: expansionBranchName.trim(),
          branchAddress: expansionBranchAddress.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as BillingPaymentResponse & { error?: string };
      if (!res.ok) {
        setBillingError(data.error || "No se pudo crear el cobro de expansion.");
        return;
      }

      setCreatedExpansionPayment(data);
      setProofFileUrl(data.payment.reference_file_url ?? "");
      setPaymentRows((prev) => [data.payment, ...prev]);
      setBranchEntitlements((prev) => [
        {
          id: `temp-${data.payment.id}`,
          quantity: expansionQtyNumber,
          monthsPurchased: expansionMonthsNumber,
          amountPaid: data.instructions.summary.amount,
          unitPrice: data.instructions.summary.unitPrice,
          status: data.instructions.summary.requiresManualProof ? "pending" : "active",
          startsAt: new Date().toISOString(),
          expiresAt: company.subscriptionEndsAt,
          createdAt: new Date().toISOString(),
          paymentReference: data.payment.payment_reference,
        },
        ...prev,
      ]);
      setBillingOk(
        data.instructions.summary.requiresManualProof
          ? "Orden creada. Sube el comprobante para validacion manual."
          : "Pago creado y aplicado automaticamente."
      );
      setBranchFlowStep(3);

      setExpansionNotes("");
      await loadBillingOptions();
    } finally {
      setBusy(false);
    }
  };

  const handleUploadPaymentProof = async (file: File) => {
    if (!createdExpansionPayment?.payment.id) {
      setBillingError("Primero crea una orden de pago.");
      return;
    }

    resetBillingFeedback();
    setProofUploading(true);
    try {
      const uploadedUrl = await uploadImage(file, "payment-reference");
      const res = await fetch("/api/customer-account/billing/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: createdExpansionPayment.payment.id,
          referenceFileUrl: uploadedUrl,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setBillingError(data.error || "No se pudo registrar el comprobante.");
        return;
      }

      setProofFileUrl(uploadedUrl);
      setCreatedExpansionPayment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          payment: {
            ...prev.payment,
            reference_file_url: uploadedUrl,
          },
        };
      });
      setPaymentRows((prev) =>
        prev.map((item) =>
          item.id === createdExpansionPayment.payment.id ? { ...item, reference_file_url: uploadedUrl } : item
        )
      );
      setBillingOk("Comprobante cargado correctamente. Te avisaremos cuando sea validado.");
    } catch {
      setBillingError("No se pudo subir el archivo. Intenta nuevamente.");
    } finally {
      setProofUploading(false);
    }
  };

  const handleSupportTicket = async () => {
    if (!supportSubject.trim() || !supportDescription.trim()) {
      setTicketError("Completa asunto y descripcion.");
      return;
    }

    resetFeedback();
    setBusy(true);
    const result = await postTicket({
      subject: supportSubject.trim(),
      description: supportDescription.trim(),
      category: supportCategory,
      priority: supportPriority,
    });

    setBusy(false);
    if (!result.ok) {
      setTicketError(result.error || "No se pudo crear el ticket.");
      return;
    }

    appendTicket(result.ticket);
    setSupportSubject("");
    setSupportDescription("");
    setTicketOk("Ticket creado correctamente.");
  };

  const handleOpenBillingSupport = (payment: PaymentSummary) => {
    setSupportCategory("billing");
    setSupportPriority("medium");
    setSupportSubject(`Consulta sobre pago ${payment.payment_reference ?? payment.id}`);
    setSupportDescription(
      [
        "Hola, necesito ayuda con este cobro.",
        `Referencia: ${payment.payment_reference ?? "-"}`,
        `Monto: ${fmtMoney(payment.amount_paid)}`,
        `Estado actual: ${toDisplayLabel(payment.status, PAYMENT_STATUS_LABELS)}`,
        "Detalle adicional:",
      ].join("\n")
    );
    setTab("soporte");
  };

  const loadMessages = useCallback(async (ticketId: string) => {
    setMessageLoading(true);
    try {
      const res = await fetch(`/api/tenant-tickets/${ticketId}/messages`);
      const data = (await res.json().catch(() => ({}))) as { messages?: TicketMessage[] };
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } finally {
      setMessageLoading(false);
    }
  }, []);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setMessages([]);
    void loadMessages(ticketId);
  };

  useEffect(() => {
    if (tab !== "soporte" || !selectedTicketId) return;
    const id = window.setInterval(() => {
      void loadMessages(selectedTicketId);
    }, 10000);
    return () => window.clearInterval(id);
  }, [tab, selectedTicketId, loadMessages]);

  const handleSendMessage = async () => {
    if (!selectedTicket || !messageDraft.trim()) return;
    setMessageLoading(true);
    try {
      const res = await fetch(`/api/tenant-tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageDraft.trim() }),
      });
      if (!res.ok) {
        setTicketError("No se pudo enviar el mensaje.");
        return;
      }
      setMessageDraft("");
      await loadMessages(selectedTicket.id);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleApplySupportTemplate = (template: "facturacion" | "tecnico" | "sucursales") => {
    if (template === "facturacion") {
      setSupportCategory("billing");
      setSupportPriority("medium");
      setSupportSubject("Consulta de facturacion / cobro");
      setSupportDescription(
        [
          "Hola, necesito ayuda con un cobro.",
          "Referencia de pago:",
          "Detalle del problema:",
          "Resultado esperado:",
        ].join("\n")
      );
      return;
    }

    if (template === "tecnico") {
      setSupportCategory("technical");
      setSupportPriority("high");
      setSupportSubject("Incidencia tecnica");
      setSupportDescription(
        [
          "Hola, reporto una incidencia tecnica.",
          "Modulo afectado:",
          "Que accion estabas realizando:",
          "Error recibido:",
        ].join("\n")
      );
      return;
    }

    setSupportCategory("account");
    setSupportPriority("medium");
    setSupportSubject("Solicitud de sucursales / capacidad");
    setSupportDescription(
      [
        "Hola, necesito apoyo con sucursales o capacidad del plan.",
        "Cantidad requerida:",
        "Fecha objetivo:",
        "Comentarios adicionales:",
      ].join("\n")
    );
  };

  const handleExportPaymentsCsv = () => {
    const headers = ["fecha", "monto", "estado", "metodo", "meses", "referencia", "comprobante_url"];
    const rows = filteredPayments.map((payment) => [
      payment.payment_date ?? "",
      String(payment.amount_paid ?? ""),
      toDisplayLabel(payment.status, PAYMENT_STATUS_LABELS),
      payment.payment_method ?? "",
      String(payment.months_paid ?? ""),
      payment.payment_reference ?? "",
      payment.reference_file_url ?? "",
    ]);

    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map((cell) => escapeCell(String(cell))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuenta_pagos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#09090b_50%,_#111827_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 md:flex-row lg:px-8">
        <aside className="hidden w-64 shrink-0 self-start rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 md:sticky md:top-6 md:block md:rounded-3xl md:p-6">
          <div className="mb-6 mt-1">
            <SaasLogo />
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Portal cliente</p>
          </div>

          <nav className="flex flex-col gap-1 sm:gap-2">
            {(Object.keys(TAB_LABELS) as PortalTab[]).map((key) => {
              const Icon = TAB_ICONS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition md:gap-3 md:rounded-xl md:px-3 ${
                    tab === key
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{TAB_LABELS[key]}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 md:gap-3 md:rounded-xl md:px-3"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">Cerrar sesion</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
          <header className="rounded-2xl border border-zinc-200 bg-white/80 px-3 py-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:rounded-3xl sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                  {company.name}
                </h1>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {TAB_LABELS[tab]} · Gestion de suscripcion y soporte
                </p>
              </div>

              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {toDisplayLabel(company.subscriptionStatus, SUBSCRIPTION_STATUS_LABELS)}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Actualizacion en tiempo real: {lastRealtimeSyncAt ? `ultimo sync ${fmtDate(lastRealtimeSyncAt)}` : "sincronizando..."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 md:hidden">
              {(Object.keys(TAB_LABELS) as PortalTab[]).map((key) => {
                const Icon = TAB_ICONS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      tab === key
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {TAB_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </header>

          <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden">
            {tab === "resumen" ? (
            <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:p-7">
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
                    <Rocket className="h-3.5 w-3.5" />
                    Centro de control de cuenta
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                    Todo lo de tu suscripcion, en un solo panel
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Administra plan, extras, sucursales, facturacion y soporte sin depender de correos dispersos.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-right dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Estado actual</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{toDisplayLabel(company.subscriptionStatus, SUBSCRIPTION_STATUS_LABELS)}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Vence: {fmtDate(company.subscriptionEndsAt)}</p>
                </div>
              </div>

              <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Plan</p>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{company.planName ?? "Sin plan"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{fmtMoney(company.planPrice)} mensual</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Extras de sucursal activos: {activeEntitlementsCount}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Sucursales activas</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{activeBranchesCount}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total registradas: {branches.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Tickets abiertos</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{openTicketsCount}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total tickets: {tickets.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Ultimo pago</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{latestPayment ? fmtMoney(latestPayment.amount_paid) : "-"}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{latestPayment ? fmtDate(latestPayment.payment_date) : "Sin pagos"}</p>
                </div>
              </div>
            </section>
            ) : null}

      {showTicketFeedback && ticketError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {ticketError}
        </div>
      ) : null}

      {showTicketFeedback && ticketOk ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {ticketOk}
        </div>
      ) : null}

      {tab === "resumen" ? (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_1.95fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Alertas proactivas</h2>
            <div className="mt-3 space-y-2">
              {accountAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    alert.tone === "warn"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      : alert.tone === "info"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                  }`}
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 text-xs opacity-90">{alert.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Vencimiento</p>
              <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{fmtDate(company.subscriptionEndsAt)}</p>
              {expiryDays != null ? (
                <p className={`text-sm ${expiryDays <= 7 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {expiryDays >= 0
                    ? `Quedan ${expiryDays} dia${expiryDays === 1 ? "" : "s"}`
                    : `Vencido hace ${Math.abs(expiryDays)} dia${Math.abs(expiryDays) === 1 ? "" : "s"}`}
                </p>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Proximas acciones</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTab("plan")}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Revisar plan y extras
                </button>
                <button
                  type="button"
                  onClick={() => setTab("facturacion")}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Ver pagos y comprobantes
                </button>
                <button
                  type="button"
                  onClick={() => setTab("sucursales")}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Solicitar nueva sucursal
                </button>
                <button
                  type="button"
                  onClick={() => setTab("soporte")}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Abrir o responder ticket
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Timeline de actividad</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pagos, tickets y compras de extras en una sola vista.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["all", "Todo"],
                ["pago", "Pagos"],
                ["ticket", "Tickets"],
                ["extra", "Extras"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityFilter(value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activityFilter === value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {filteredActivityTimeline.length === 0 ? (
                <p className="text-sm text-zinc-500">Aun no hay actividad para mostrar.</p>
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
          </div>
        </section>
      ) : null}

      {tab === "plan" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Tu plan actual</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Plan</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{company.planName ?? "Sin plan"}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Precio mensual</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtMoney(company.planPrice)}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Extras activos</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{activeAddonRows.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Comparador de cambio</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Compara tu plan actual con el plan objetivo antes de confirmar.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Plan actual</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{planPreview?.currentPlan?.name ?? company.planName ?? "-"}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{fmtMoney(planPreview?.pricing.currentPrice ?? company.planPrice)}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Plan objetivo</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{planPreview?.targetPlan?.name ?? selectedPlanOption?.name ?? "-"}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{fmtMoney(planPreview?.pricing.targetPrice ?? selectedPlanOption?.price ?? null)}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-500">Impacto mensual</p>
                <p className={`font-semibold ${(planPreview?.pricing.monthlyDiff ?? 0) > 0 ? "text-amber-700 dark:text-amber-300" : (planPreview?.pricing.monthlyDiff ?? 0) < 0 ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                  {planPreview ? fmtMoney(planPreview.pricing.monthlyDiff) : "-"}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">Pago inmediato: {planPreview ? fmtMoney(planPreview.pricing.amountDue) : "-"}</p>
              </div>
            </div>
          </div>

          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Paso 1</p>
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
                    <select
                      value={planMethodSlug}
                      onChange={(event) => setPlanMethodSlug(event.target.value)}
                      aria-label="Metodo de pago para cambio de plan"
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {planPreview.paymentMethods.map((method) => (
                        <option key={method.id} value={method.slug}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid h-11 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                      No requiere pago adicional
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="text-zinc-700 dark:text-zinc-300">Precio estimado: <span className="font-semibold">{fmtMoney(selectedPlanOption?.price ?? null)}</span></p>
                  <p className="text-zinc-600 dark:text-zinc-400">Incluye hasta {selectedPlanOption?.max_branches ?? "-"} sucursales.</p>
                  {planPreview ? (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Diferencia a pagar ahora: <span className="font-semibold">{fmtMoney(planPreview.pricing.amountDue)}</span>
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Impacto del cambio</p>
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
                    : planPreview?.pricing.requiresPayment
                    ? "Pagar y cambiar plan"
                    : "Cambiar plan ahora"}
                </button>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Paso 2</p>
              <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">Quiero agregar un extra</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Selecciona el servicio, revisa el impacto y compra desde aqui.</p>

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
                        Instancia unica
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {selectedAddonOwned ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    Ya tienes este extra activo.
                    {selectedAddonSingleInstance
                      ? " No se puede comprar nuevamente."
                      : " Si necesitas otra configuracion, escríbenos en notas."}
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Este extra es de instancia unica. La cantidad siempre sera 1.</p>
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
                  <select
                    value={addonMethodSlug}
                    onChange={(event) => setAddonMethodSlug(event.target.value)}
                    aria-label="Metodo de pago para extra"
                    className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {addonPreview.paymentMethods.map((method) => (
                      <option key={method.id} value={method.slug}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid h-11 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                    No requiere pago adicional
                  </div>
                )}

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="text-zinc-700 dark:text-zinc-300">Precio unitario: <span className="font-semibold">{fmtMoney(addonPreview?.pricing.unitPrice ?? addonEstimatedUnit)}</span></p>
                  <p className="text-zinc-700 dark:text-zinc-300">Total estimado: <span className="font-semibold">{fmtMoney(addonPreview?.pricing.amountDue ?? addonEstimatedTotal)}</span></p>
                  <p className="text-zinc-600 dark:text-zinc-400">{selectedAddonIsMonthly ? "Cobro mensual co-terminado con tu plan." : "Cobro unico."}</p>
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Impacto del extra</p>
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

          <div className="grid items-stretch gap-4 xl:grid-cols-2">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Tus extras activos</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Servicios que ya tienes habilitados en tu cuenta.</p>
              <div className="mt-3 flex min-h-[16rem] flex-1 flex-col gap-2">
                {activeAddonRows.length === 0 ? (
                  <div className="grid h-full place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
                    Aun no tienes extras activos.
                  </div>
                ) : (
                  activeAddonRows.map((addon) => (
                    <div key={addon.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{addon.addonName}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Estado: {toDisplayLabel(addon.status, ADDON_STATUS_LABELS)}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Tipo: {addon.expires_at ? "Mensual co-terminado" : "Pago unico"}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Vence: {fmtDate(addon.expires_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Compras de sucursales extra</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Historial resumido para seguimiento rápido.</p>
              <div className="mt-3 flex min-h-[16rem] flex-1 flex-col space-y-2 overflow-y-auto pr-1">
                {branchEntitlements.length === 0 ? (
                  <div className="grid h-full place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
                    Todavia no hay compras registradas.
                  </div>
                ) : (
                  branchEntitlements.map((entitlement) => (
                    <div key={entitlement.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{entitlement.quantity} sucursal(es) · {fmtMoney(entitlement.amountPaid)}</p>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(entitlement.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Estado: {toDisplayLabel(entitlement.status, ADDON_STATUS_LABELS)}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Referencia: {entitlement.paymentReference ?? "-"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "sucursales" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Sucursales actuales</h2>
            <div className="mt-3 space-y-2">
              {branches.length === 0 ? (
                <p className="text-sm text-zinc-500">No tienes sucursales registradas.</p>
              ) : (
                branches.map((branch) => (
                  <div key={branch.id} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{branch.name}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">{branch.address || "Sin direccion"}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">{branch.is_active ? "Activa" : "Inactiva"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Solicitar nueva sucursal</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {billingLoading
                ? "Cargando reglas de expansion..."
                : canRequestBranchWithoutPayment
                ? "Tu plan todavia tiene cupo. Enviaremos la solicitud para crear la sucursal."
                : "Llegaste al limite de sucursales del plan. Debes generar pago de expansion para continuar."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {([
                [1, "Datos"],
                [2, "Impacto"],
                [3, "Confirmacion"],
              ] as const).map(([step, label]) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step === 3 && isProjectedCapacityInvalid) {
                      setBillingError("La proyeccion supera tu capacidad disponible. Ajusta la cantidad antes de continuar.");
                      return;
                    }
                    setBranchFlowStep(step);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    branchFlowStep === step
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  Paso {step}: {label}
                </button>
              ))}
            </div>

            {!billingLoading && !canRequestBranchWithoutPayment ? (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Precio base por sucursal extra: {fmtMoney(branchUnitPrice)} / mes. Si tu plan vence pronto,
                el primer cobro se prorratea y el extra queda alineado al vencimiento del plan.
              </p>
            ) : null}

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Capacidad actual</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {activeBranchesCount} activas
                {billingOptions?.maxBranches != null ? ` de ${billingOptions.maxBranches} incluidas` : " (plan sin limite)"}
              </p>
              {typeof billingOptions?.extraBranchEntitlements === "number" && billingOptions.extraBranchEntitlements > 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  + {billingOptions.extraBranchEntitlements} extra(s) compradas · capacidad efectiva: {billingOptions.effectiveMaxBranches ?? "sin limite"}
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
                    placeholder="Direccion estimada"
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
                        aria-label="Metodo de pago"
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
                        {activeBranchesCount} activas / {billingOptions?.effectiveMaxBranches ?? "sin limite"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
                      <p className="text-xs text-zinc-500">Capacidad proyectada</p>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {projectedActiveBranches} activas / {projectedEffectiveMaxBranches ?? "sin limite"}
                      </p>
                      <p className={`text-xs ${projectedRemainingBranches != null && projectedRemainingBranches < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        Cupo restante: {projectedRemainingBranches ?? "sin limite"}
                      </p>
                    </div>
                  </div>

                  {isProjectedCapacityInvalid ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      La proyeccion queda por debajo de 0 cupos. Incrementa la cantidad de expansion para continuar.
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
                          Dias hasta vencimiento del plan: {billingOptions.daysUntilPlanEnd}. El total final puede prorratearse en el primer ciclo.
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
                    placeholder="Notas para soporte/facturacion"
                    className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />

                  {canRequestBranchWithoutPayment ? (
                    <button
                      type="button"
                      onClick={handleBranchRequest}
                      disabled={busy || billingLoading}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {busy ? "Enviando..." : "Enviar solicitud de sucursal"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateExpansionPayment}
                      disabled={busy || billingLoading || !billingOptions?.paymentMethods.length}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
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
                          Estado: {toDisplayLabel(createdExpansionPayment.payment.status ?? "pending", PAYMENT_STATUS_LABELS)}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total cobrado: {fmtMoney(createdExpansionPayment.instructions.summary.amount)}
                        </p>
                        {typeof createdExpansionPayment.instructions.summary.firstCycleFactor === "number" &&
                        typeof createdExpansionPayment.instructions.summary.effectiveMonths === "number" ? (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Prorrateo primer ciclo: {createdExpansionPayment.instructions.summary.firstCycleFactor.toFixed(3)} · meses efectivos: {createdExpansionPayment.instructions.summary.effectiveMonths.toFixed(3)}
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
                                void handleUploadPaymentProof(file);
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
                  onClick={handleBranchWizardBack}
                  disabled={branchFlowStep === 1}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={handleBranchWizardNext}
                  disabled={branchFlowStep === 3 || (branchFlowStep === 2 && isProjectedCapacityInvalid)}
                  className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "facturacion" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Facturacion y cobros</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Revisa tus pagos, estado de cobro y comprobantes disponibles.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Total pagado</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtMoney(billingPaidTotal)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Pendiente</p>
              <p className="font-semibold text-amber-700 dark:text-amber-300">{fmtMoney(billingPendingTotal)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Pagos pendientes</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{pendingPaymentsCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-xs text-zinc-500">Ultimo pago aprobado</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{fmtDate(latestPaidPaymentDate)}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <select
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
              aria-label="Filtrar por estado de pago"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="pending_validation">Pendiente de validacion</option>
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
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="date"
              value={paymentDateFrom}
              onChange={(event) => setPaymentDateFrom(event.target.value)}
              aria-label="Fecha desde"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="date"
              value={paymentDateTo}
              onChange={(event) => setPaymentDateTo(event.target.value)}
              aria-label="Fecha hasta"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={handleExportPaymentsCsv}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Exportar CSV
            </button>
          </div>

          {createdExpansionPayment &&
          ["pending", "pending_validation"].includes(createdExpansionPayment.payment.status ?? "") ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Hay una orden de expansion pendiente de validacion: {createdExpansionPayment.payment.payment_reference}. Puedes completar o verificar el comprobante desde la pestana de Sucursales.
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="px-2 py-2">Fecha</th>
                  <th className="px-2 py-2">Monto</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Metodo</th>
                  <th className="px-2 py-2">Meses</th>
                  <th className="px-2 py-2">Referencia</th>
                  <th className="px-2 py-2">Comprobante</th>
                  <th className="px-2 py-2">Accion</th>
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
                      <td className="px-2 py-2">{fmtDate(payment.payment_date)}</td>
                      <td className="px-2 py-2">{fmtMoney(payment.amount_paid)}</td>
                      <td className="px-2 py-2">{toDisplayLabel(payment.status, PAYMENT_STATUS_LABELS)}</td>
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
                          onClick={() => handleOpenBillingSupport(payment)}
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
            Si necesitas factura o ajuste de cobro, usa la pestaña de Soporte y categoria Facturacion.
          </div>
        </section>
      ) : null}

      {tab === "soporte" ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Crear ticket</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplySupportTemplate("facturacion")}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Plantilla facturacion
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySupportTemplate("tecnico")}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Plantilla tecnica
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySupportTemplate("sucursales")}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Plantilla sucursales
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <input
                  value={supportSubject}
                  onChange={(event) => setSupportSubject(event.target.value)}
                  placeholder="Asunto"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={supportCategory}
                    onChange={(event) => setSupportCategory(event.target.value as typeof supportCategory)}
                    aria-label="Categoria del ticket"
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="general">{SUPPORT_CATEGORY_LABELS.general}</option>
                    <option value="billing">{SUPPORT_CATEGORY_LABELS.billing}</option>
                    <option value="technical">{SUPPORT_CATEGORY_LABELS.technical}</option>
                    <option value="product">{SUPPORT_CATEGORY_LABELS.product}</option>
                    <option value="account">{SUPPORT_CATEGORY_LABELS.account}</option>
                  </select>
                  <select
                    value={supportPriority}
                    onChange={(event) => setSupportPriority(event.target.value as typeof supportPriority)}
                    aria-label="Prioridad del ticket"
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="low">{PRIORITY_LABELS.low}</option>
                    <option value="medium">{PRIORITY_LABELS.medium}</option>
                    <option value="high">{PRIORITY_LABELS.high}</option>
                    <option value="critical">{PRIORITY_LABELS.critical}</option>
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
                  onClick={handleSupportTicket}
                  disabled={busy}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {busy ? "Enviando..." : "Crear ticket"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mis tickets</h3>
              <div className="mt-3 space-y-2">
                {tickets.length === 0 ? (
                  <p className="text-sm text-zinc-500">No tienes tickets aun.</p>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleSelectTicket(ticket.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selectedTicketId === ticket.id
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.subject}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {STATUS_LABELS[ticket.status] ?? ticket.status} · {fmtDate(ticket.lastMessageAt)}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        SLA objetivo: {getTicketSlaHours(ticket.priority)}h · Prioridad {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-zinc-700 dark:bg-zinc-900/80">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Conversacion</h3>
            {!selectedTicket ? (
              <p className="mt-3 text-sm text-zinc-500">Selecciona un ticket para ver y responder mensajes.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTicket.subject}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{selectedTicket.description}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    SLA objetivo: {getTicketSlaHours(selectedTicket.priority)}h · antiguedad aproximada: {(() => {
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
                        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(message.created_at)}</p>
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
                    onClick={handleSendMessage}
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
      ) : null}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
              Soporte directo: <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href={`mailto:${company.supportEmail}`}>{company.supportEmail}</a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
