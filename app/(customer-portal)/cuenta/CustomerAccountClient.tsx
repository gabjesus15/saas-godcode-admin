"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CustomerAccountShell } from "@/components/customer-portal/CustomerAccountShell";
import {
  ADDON_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PORTAL_TAB_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/components/customer-portal/customer-account-constants";
import { normalizeAddonIdentity, isSingleInstanceAddon } from "@/components/customer-portal/customer-account-addon-utils";
import {
  branchEntitlementStatusLabel,
  displayStatus,
  fmtDate,
  fmtMoney,
} from "@/components/customer-portal/customer-account-format";
import {
  DEFAULT_STORE_THEME,
  STORE_THEME_FIELD_LABELS,
  STORE_THEME_TEMPLATES,
} from "@/components/customer-portal/customer-account-store-theme-constants";
import type {
  AccountActivityItem,
  ActiveAddon,
  AddonOption,
  AddonPurchasePreview,
  BillingMethodOption,
  BillingOptionsResponse,
  BillingPaymentResponse,
  BranchEntitlementSummary,
  BranchSummary,
  CompanySnapshot,
  CustomerAccountClientProps,
  PaymentSummary,
  PlanChangePreview,
  PlanOption,
  PortalTab,
  RealtimeSnapshotResponse,
  StoreThemeAssetField,
  StoreThemeAutosaveStatus,
  StoreThemeConfig,
  StoreThemeResponse,
  TicketMessage,
  TicketSummary,
} from "@/components/customer-portal/customer-account-types";
import { AccountResumenTab } from "@/components/customer-portal/tabs/account-resumen-tab";
import { AccountTiendaTab } from "@/components/customer-portal/tabs/account-tienda-tab";
import { AccountPlanTab } from "@/components/customer-portal/tabs/account-plan-tab";
import { AccountSucursalesTab } from "@/components/customer-portal/tabs/account-sucursales-tab";
import { AccountFacturacionTab } from "@/components/customer-portal/tabs/account-facturacion-tab";
import { AccountSoporteTab } from "@/components/customer-portal/tabs/account-soporte-tab";

import { resolveAddonOfferForPlan } from "../../../lib/plan-offer-rules";
import { uploadImage } from "../../../components/tenant/utils/cloudinary";

export type { CustomerAccountClientProps } from "@/components/customer-portal/customer-account-types";

function getStoreThemeSignature(theme: StoreThemeConfig | null): string {
  if (!theme) return "";
  return JSON.stringify(theme);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = String(hex ?? "").trim();
  const shortMatch = /^#([a-fA-F0-9]{3})$/.exec(normalized);
  const longMatch = /^#([a-fA-F0-9]{6})$/.exec(normalized);
  const expanded = shortMatch
    ? shortMatch[1].split("").map((ch) => ch + ch).join("")
    : longMatch
      ? longMatch[1]
      : null;
  if (!expanded) return null;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  if (l1 == null || l2 == null) return null;
  const maxL = Math.max(l1, l2);
  const minL = Math.min(l1, l2);
  return (maxL + 0.05) / (minL + 0.05);
}

async function getImageFileDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = new globalThis.Image();
    probe.onload = () => {
      const width = probe.naturalWidth;
      const height = probe.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen."));
    };
    probe.src = objectUrl;
  });
}

async function validateStoreThemeAssetFile(field: StoreThemeAssetField, file: File): Promise<{ ok: boolean; error?: string; hint?: string }> {
  const maxMb = field === "logoUrl" ? 3 : 7;
  const maxBytes = maxMb * 1024 * 1024;
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "El archivo debe ser una imagen valida." };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `El archivo excede ${maxMb} MB. Comprime la imagen e intenta nuevamente.` };
  }

  try {
    const { width, height } = await getImageFileDimensions(file);
    if (field === "logoUrl") {
      if (width < 256 || height < 256) {
        return { ok: false, error: "El logo debe tener al menos 256x256 px para verse nitido." };
      }
      const ratio = width / height;
      if (ratio < 0.7 || ratio > 1.4) {
        return { ok: true, hint: "Recomendacion: usa un logo casi cuadrado para mejor encuadre en navbar." };
      }
    } else {
      if (width < 1200 || height < 675) {
        return { ok: false, error: "El fondo debe tener al menos 1200x675 px para evitar pixelado." };
      }
      const ratio = width / height;
      if (ratio < 1.5) {
        return { ok: true, hint: "Recomendacion: usa imagen panoramica (16:9 aprox) para mejor resultado." };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo validar dimensiones de la imagen." };
  }
}

function normalizeStoreThemeInput(input: unknown, fallbackName: string): StoreThemeConfig {
  const value = (input ?? {}) as Record<string, unknown>;
  const defaults = {
    ...DEFAULT_STORE_THEME,
    displayName: fallbackName,
  };
  return {
    displayName: String(value.displayName ?? defaults.displayName),
    primaryColor: String(value.primaryColor ?? defaults.primaryColor),
    secondaryColor: String(value.secondaryColor ?? defaults.secondaryColor),
    priceColor: String(value.priceColor ?? defaults.priceColor),
    discountColor: String(value.discountColor ?? defaults.discountColor),
    hoverColor: String(value.hoverColor ?? defaults.hoverColor),
    backgroundColor: String(value.backgroundColor ?? defaults.backgroundColor),
    backgroundImageUrl: String(value.backgroundImageUrl ?? defaults.backgroundImageUrl),
    logoUrl: String(value.logoUrl ?? defaults.logoUrl),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toPart = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toPart(r)}${toPart(g)}${toPart(b)}`;
}

function blendRgb(
  from: [number, number, number],
  to: [number, number, number],
  ratio: number
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
    from[2] + (to[2] - from[2]) * ratio,
  ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function suggestAccessibleColorNearTarget(
  targetHex: string,
  againstHex: string,
  minRatio: number,
  primaryHex: string
): string {
  const targetRgb = hexToRgb(targetHex);
  const primaryRgb = hexToRgb(primaryHex);
  const againstRgb = hexToRgb(againstHex);
  if (!targetRgb || !againstRgb) return targetHex;

  const basePrimary = primaryRgb ?? targetRgb;
  const bases: Array<[number, number, number]> = [
    targetRgb,
    blendRgb(targetRgb, basePrimary, 0.25),
    blendRgb(targetRgb, basePrimary, 0.5),
  ];

  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  let bestHex = targetHex;
  let bestScore = Number.POSITIVE_INFINITY;

  const evaluate = (candidateRgb: [number, number, number], basePenalty: number) => {
    const hex = rgbToHex(candidateRgb[0], candidateRgb[1], candidateRgb[2]);
    const ratio = contrastRatio(hex, againstHex) ?? 0;
    if (ratio < minRatio) return;
    const score = colorDistance(candidateRgb, targetRgb) + basePenalty;
    if (score < bestScore) {
      bestScore = score;
      bestHex = hex;
    }
  };

  evaluate(targetRgb, 0);
  for (let i = 0; i < bases.length; i += 1) {
    const base = bases[i];
    const basePenalty = i * 6;
    for (let step = 0; step <= 1; step += 0.04) {
      evaluate(blendRgb(base, white, step), basePenalty);
      evaluate(blendRgb(base, black, step), basePenalty);
    }
  }

  return bestHex;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [subscriptionCancelReason, setSubscriptionCancelReason] = useState("");
  const [subscriptionCancelBusy, setSubscriptionCancelBusy] = useState(false);
  const [subscriptionCancelError, setSubscriptionCancelError] = useState<string | null>(null);
  const [subscriptionCancelOk, setSubscriptionCancelOk] = useState<string | null>(null);
  const [subscriptionCancelModalOpen, setSubscriptionCancelModalOpen] = useState(false);
  const [subscriptionCancelAcknowledge, setSubscriptionCancelAcknowledge] = useState(false);
  const [subscriptionCancelFinalConfirm, setSubscriptionCancelFinalConfirm] = useState(false);
  const [subscriptionReactivateBusy, setSubscriptionReactivateBusy] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(company.subscriptionStatus);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState(company.subscriptionEndsAt);
  const [storeThemeLoading, setStoreThemeLoading] = useState(false);
  const [storeThemeSaving, setStoreThemeSaving] = useState(false);
  const [storeThemePublishing, setStoreThemePublishing] = useState(false);
  const [storeThemeRestoring, setStoreThemeRestoring] = useState<string | null>(null);
  const [storeThemeError, setStoreThemeError] = useState<string | null>(null);
  const [storeThemeOk, setStoreThemeOk] = useState<string | null>(null);
  const [storeThemePublished, setStoreThemePublished] = useState<StoreThemeConfig | null>(null);
  const [storeThemeDraft, setStoreThemeDraft] = useState<StoreThemeConfig | null>(null);
  const [storeThemeVersions, setStoreThemeVersions] = useState<StoreThemeResponse["versions"]>([]);
  const [storeThemeUpdatedAt, setStoreThemeUpdatedAt] = useState<string | null>(null);
  const [storeThemeUpdatedBy, setStoreThemeUpdatedBy] = useState<string | null>(null);
  const [storeThemeHasUnpublished, setStoreThemeHasUnpublished] = useState(false);
  const [storeThemeAssetUploading, setStoreThemeAssetUploading] = useState<StoreThemeAssetField | null>(null);
  const [storeThemeAssetDragOver, setStoreThemeAssetDragOver] = useState<StoreThemeAssetField | null>(null);
  const [storeThemeAssetHint, setStoreThemeAssetHint] = useState<Record<StoreThemeAssetField, string | null>>({
    logoUrl: null,
    backgroundImageUrl: null,
  });
  const [storeThemeAssetLocalPreview, setStoreThemeAssetLocalPreview] = useState<{
    logoUrl: string | null;
    backgroundImageUrl: string | null;
  }>({
    logoUrl: null,
    backgroundImageUrl: null,
  });
  const [storeThemeSelectedTemplate, setStoreThemeSelectedTemplate] = useState(STORE_THEME_TEMPLATES[0]?.id ?? "");
  const [storeThemePublishComment, setStoreThemePublishComment] = useState("");
  const [storeThemeAutosaveStatus, setStoreThemeAutosaveStatus] = useState<StoreThemeAutosaveStatus>("idle");
  const [storeThemeAutosaveError, setStoreThemeAutosaveError] = useState<string | null>(null);
  const [storeThemeLastSavedSignature, setStoreThemeLastSavedSignature] = useState("");
  const storeThemeAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const storePreviewTheme = storeThemeDraft ?? storeThemePublished;
  const storeThemeDraftSignature = useMemo(() => getStoreThemeSignature(storeThemeDraft), [storeThemeDraft]);
  const storeThemeHasLocalUnsavedChanges = useMemo(
    () => Boolean(storeThemeDraft) && storeThemeDraftSignature !== storeThemeLastSavedSignature,
    [storeThemeDraft, storeThemeDraftSignature, storeThemeLastSavedSignature]
  );
  const storeThemeDiffRows = useMemo(() => {
    if (!storeThemeDraft || !storeThemePublished) return [];
    return (Object.keys(STORE_THEME_FIELD_LABELS) as Array<keyof StoreThemeConfig>)
      .filter((key) => storeThemeDraft[key] !== storeThemePublished[key])
      .map((key) => ({
        key,
        label: STORE_THEME_FIELD_LABELS[key],
        draftValue: storeThemeDraft[key],
        publishedValue: storeThemePublished[key],
      }));
  }, [storeThemeDraft, storeThemePublished]);
  const storeThemeChecklist = useMemo(() => {
    if (!storeThemeDraft) return [] as Array<{ id: string; title: string; ok: boolean; detail: string }>;
    const ctaContrast = contrastRatio(storeThemeDraft.primaryColor, "#ffffff");
    const priceContrast = contrastRatio(storeThemeDraft.priceColor, storeThemeDraft.backgroundColor);
    const discountContrast = contrastRatio(storeThemeDraft.discountColor, storeThemeDraft.backgroundColor);
    return [
      {
        id: "cta-contrast",
        title: "Contraste CTA principal",
        ok: (ctaContrast ?? 0) >= 4.5,
        detail: ctaContrast == null ? "No se pudo calcular" : `Ratio ${ctaContrast.toFixed(2)} (objetivo >= 4.5)`,
      },
      {
        id: "price-contrast",
        title: "Contraste color de precio",
        ok: (priceContrast ?? 0) >= 3,
        detail: priceContrast == null ? "No se pudo calcular" : `Ratio ${priceContrast.toFixed(2)} (objetivo >= 3.0)`,
      },
      {
        id: "discount-contrast",
        title: "Contraste color de descuento",
        ok: (discountContrast ?? 0) >= 3,
        detail: discountContrast == null ? "No se pudo calcular" : `Ratio ${discountContrast.toFixed(2)} (objetivo >= 3.0)`,
      },
      {
        id: "display-name",
        title: "Nombre visible definido",
        ok: storeThemeDraft.displayName.trim().length > 1,
        detail: storeThemeDraft.displayName.trim().length > 1 ? "Nombre correcto" : "Define un nombre visible",
      },
      {
        id: "logo",
        title: "Logo configurado",
        ok: storeThemeDraft.logoUrl.trim().length > 0,
        detail: storeThemeDraft.logoUrl.trim().length > 0 ? "Logo listo" : "Recomendado para una marca consistente",
      },
    ];
  }, [storeThemeDraft]);
  const storeThemeChecklistBlockingIssues = useMemo(
    () => storeThemeChecklist.filter((item) => !item.ok && ["cta-contrast", "price-contrast", "discount-contrast"].includes(item.id)),
    [storeThemeChecklist]
  );
  const latestPublishedVersion = storeThemeVersions[0] ?? null;
  const publicationStateLabel = !storeThemeHasUnpublished
    ? "Producción al día"
    : storeThemeHasLocalUnsavedChanges
      ? "Borrador local sin guardar"
      : "Borrador guardado pendiente";
  const storeThemeContrastSuggestions = useMemo(() => {
    if (!storeThemeDraft) {
      return {
        changes: [] as Array<{ key: keyof StoreThemeConfig; label: string; from: string; to: string; ratio: number | null; min: number }>,
        nextTheme: null as StoreThemeConfig | null,
      };
    }

    const rules: Array<{ key: keyof StoreThemeConfig; against: string; minRatio: number }> = [
      { key: "primaryColor", against: "#ffffff", minRatio: 4.5 },
      { key: "priceColor", against: storeThemeDraft.backgroundColor, minRatio: 3 },
      { key: "discountColor", against: storeThemeDraft.backgroundColor, minRatio: 3 },
    ];

    const nextTheme: StoreThemeConfig = { ...storeThemeDraft };
    const changes: Array<{ key: keyof StoreThemeConfig; label: string; from: string; to: string; ratio: number | null; min: number }> = [];

    rules.forEach((rule) => {
      const currentColor = storeThemeDraft[rule.key];
      const currentRatio = contrastRatio(currentColor, rule.against);
      if ((currentRatio ?? 0) >= rule.minRatio) return;

      const suggested = suggestAccessibleColorNearTarget(
        currentColor,
        rule.against,
        rule.minRatio,
        storeThemeDraft.primaryColor
      );

      if (suggested.toLowerCase() === currentColor.toLowerCase()) return;

      nextTheme[rule.key] = suggested;
      changes.push({
        key: rule.key,
        label: STORE_THEME_FIELD_LABELS[rule.key],
        from: currentColor,
        to: suggested,
        ratio: contrastRatio(suggested, rule.against),
        min: rule.minRatio,
      });
    });

    return {
      changes,
      nextTheme: changes.length > 0 ? nextTheme : null,
    };
  }, [storeThemeDraft]);

  const expiryDays = daysUntil(subscriptionEndsAt);
  const normalizedSubscriptionStatus = String(subscriptionStatus ?? "").trim().toLowerCase();
  const cancellationScheduled = normalizedSubscriptionStatus === "cancelled" && expiryDays != null && expiryDays > 0;
  const canReactivateCancellation = cancellationScheduled;
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
  const recommendedPlanOption = useMemo(() => {
    if (!availablePlans.length) return null;
    const eligible = availablePlans.filter((plan) => plan.max_branches == null || plan.max_branches >= activeBranchesCount);
    const pool = eligible.length > 0 ? eligible : availablePlans;
    return [...pool].sort((a, b) => {
      const pa = Number(a.price ?? Number.POSITIVE_INFINITY);
      const pb = Number(b.price ?? Number.POSITIVE_INFINITY);
      return pa - pb;
    })[0] ?? null;
  }, [availablePlans, activeBranchesCount]);
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
  const selectedAddonModeLabel = selectedAddonIsMonthly ? "Mensual co-terminado" : "Pago único";
  const addonEstimatedUnit = selectedAddonOption?.price_monthly ?? selectedAddonOption?.price_one_time ?? null;
  const addonEstimatedTotal = addonEstimatedUnit != null
    ? addonEstimatedUnit * selectedAddonEffectiveQty * (selectedAddonOption?.price_monthly ? addonMonthsNumber : 1)
    : null;
  const planMonthlyDelta = planPreview?.pricing.monthlyDiff ??
    (selectedPlanOption?.price != null && company.planPrice != null
      ? Number(selectedPlanOption.price) - Number(company.planPrice)
      : null);
  const planAnnualDelta = planMonthlyDelta != null ? Number((planMonthlyDelta * 12).toFixed(2)) : null;
  const selectedPlanMethodOption =
    planPreview?.paymentMethods.find((method) => method.slug === planMethodSlug) ??
    planPreview?.paymentMethods[0] ??
    null;
  const selectedAddonMethodOption =
    addonPreview?.paymentMethods.find((method) => method.slug === addonMethodSlug) ??
    addonPreview?.paymentMethods[0] ??
    null;
  const addonOfferMatrix = useMemo(() => {
    return availableAddons.map((addon) => {
      const cells = availablePlans.map((plan) => {
        const decision = resolveAddonOfferForPlan(
          {
            id: plan.id,
            name: plan.name,
            max_branches: plan.max_branches,
            max_users: plan.max_users,
            features: plan.features,
            marketing_lines: plan.marketing_lines,
          },
          {
            id: addon.id,
            slug: addon.slug ?? null,
            name: addon.name,
            type: addon.type,
            description: addon.description,
          }
        );
        return { planId: plan.id, decision };
      });
      return { addon, cells };
    });
  }, [availableAddons, availablePlans]);

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
      detail: `${fmtMoney(payment.amount_paid, company.currency, company.locale)} · ${displayStatus(payment.status, PAYMENT_STATUS_LABELS)}`,
      status: String(payment.status ?? ""),
      occurredAt: payment.payment_date ?? "",
      amount: payment.amount_paid,
    }));

    const ticketItems: AccountActivityItem[] = tickets.map((ticket) => ({
      id: `t-${ticket.id}`,
      type: "ticket",
      title: ticket.subject,
      detail: `${displayStatus(ticket.status, TICKET_STATUS_LABELS)} · ${TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}`,
      status: ticket.status,
      occurredAt: ticket.lastMessageAt || ticket.createdAt,
    }));

    const entitlementItems: AccountActivityItem[] = branchEntitlements.map((entitlement) => ({
      id: `e-${entitlement.id}`,
      type: "extra",
      title: `Compra de ${entitlement.quantity} sucursal(es) extra`,
      detail: `${fmtMoney(entitlement.amountPaid, company.currency, company.locale)} · ${branchEntitlementStatusLabel(entitlement.status)}`,
      status: entitlement.status,
      occurredAt: entitlement.createdAt,
      amount: entitlement.amountPaid,
    }));

    return [...paymentItems, ...ticketItems, ...entitlementItems]
      .filter((item) => item.occurredAt)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 20);
  }, [paymentRows, tickets, branchEntitlements, company]);

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
      if (data.company) {
        setSubscriptionStatus(data.company.subscription_status ?? null);
        setSubscriptionEndsAt(data.company.subscription_ends_at ?? null);
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

  const handleCancelSubscription = async () => {
    setSubscriptionCancelError(null);
    setSubscriptionCancelOk(null);
    setTicketError(null);
    setTicketOk(null);

    if (!subscriptionEndsAt) {
      setSubscriptionCancelError("No pudimos determinar la fecha de vencimiento de tu plan.");
      return;
    }

    setSubscriptionCancelBusy(true);
    try {
      const res = await fetch("/api/customer-account/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: subscriptionCancelReason }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        subscriptionStatus?: string;
        subscriptionEndsAt?: string | null;
      };

      if (!res.ok) {
        setSubscriptionCancelError(data.error || "No se pudo programar la cancelacion.");
        return;
      }

      setSubscriptionStatus(data.subscriptionStatus ?? "cancelled");
      setSubscriptionEndsAt(data.subscriptionEndsAt ?? subscriptionEndsAt);
      setSubscriptionCancelOk(data.message || "Tu suscripcion quedo cancelada.");
      setSubscriptionCancelReason("");
      setSubscriptionCancelModalOpen(false);
      setSubscriptionCancelAcknowledge(false);
      setSubscriptionCancelFinalConfirm(false);
      await loadRealtimeSnapshot();
    } finally {
      setSubscriptionCancelBusy(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setSubscriptionCancelError(null);
    setSubscriptionCancelOk(null);
    setTicketError(null);
    setTicketOk(null);
    setSubscriptionReactivateBusy(true);
    try {
      const res = await fetch("/api/customer-account/reactivate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        subscriptionStatus?: string;
        subscriptionEndsAt?: string | null;
      };

      if (!res.ok) {
        setSubscriptionCancelError(data.error || "No se pudo reactivar la suscripcion.");
        return;
      }

      setSubscriptionStatus(data.subscriptionStatus ?? "active");
      setSubscriptionEndsAt(data.subscriptionEndsAt ?? subscriptionEndsAt);
      setSubscriptionCancelOk(data.message || "Suscripcion reactivada correctamente.");
      await loadRealtimeSnapshot();
    } finally {
      setSubscriptionReactivateBusy(false);
    }
  };

  const loadStoreTheme = useCallback(async () => {
    setStoreThemeLoading(true);
    setStoreThemeError(null);
    try {
      const res = await fetch("/api/customer-account/store-theme", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as Partial<StoreThemeResponse> & { error?: string };
      if (!res.ok || !data.published || !data.draft || !Array.isArray(data.versions)) {
        setStoreThemeError(data.error || "No se pudo cargar la configuracion de tienda.");
        return;
      }

      setStoreThemePublished(data.published);
      setStoreThemeDraft(data.draft.theme);
      setStoreThemeVersions(data.versions);
      setStoreThemeUpdatedAt(data.draft.updatedAt ?? null);
      setStoreThemeUpdatedBy(data.draft.updatedByEmail ?? null);
      setStoreThemeHasUnpublished(Boolean(data.draft.hasUnpublishedChanges));
      setStoreThemeLastSavedSignature(getStoreThemeSignature(data.draft.theme));
      setStoreThemeAutosaveStatus("idle");
      setStoreThemeAutosaveError(null);
    } finally {
      setStoreThemeLoading(false);
    }
  }, []);

  const persistStoreDraft = useCallback(async (mode: "manual" | "autosave") => {
    if (!storeThemeDraft) return;
    if (mode === "manual") {
      setStoreThemeSaving(true);
      setStoreThemeError(null);
      setStoreThemeOk(null);
      setStoreThemeAutosaveError(null);
    } else {
      setStoreThemeAutosaveStatus("saving");
      setStoreThemeAutosaveError(null);
    }

    const themeToSave = storeThemeDraft;
    setStoreThemeSaving(true);
    try {
      const res = await fetch("/api/customer-account/store-theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeToSave }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        draft?: {
          theme?: StoreThemeConfig;
          updatedAt?: string | null;
          updatedByEmail?: string | null;
          hasUnpublishedChanges?: boolean;
        };
      };
      if (!res.ok) {
        const err = data.error || "No se pudo guardar el borrador.";
        if (mode === "manual") {
          setStoreThemeError(err);
        } else {
          setStoreThemeAutosaveStatus("error");
          setStoreThemeAutosaveError(err);
        }
        return;
      }
      const savedTheme = data.draft?.theme ?? themeToSave;
      setStoreThemeLastSavedSignature(getStoreThemeSignature(savedTheme));
      setStoreThemeUpdatedAt(data.draft?.updatedAt ?? new Date().toISOString());
      setStoreThemeUpdatedBy(data.draft?.updatedByEmail ?? storeThemeUpdatedBy);
      setStoreThemeHasUnpublished(Boolean(data.draft?.hasUnpublishedChanges ?? true));

      if (mode === "manual") {
        setStoreThemeOk(data.message || "Borrador guardado.");
        setStoreThemeAutosaveStatus("saved");
      } else {
        setStoreThemeAutosaveStatus("saved");
      }
    } finally {
      setStoreThemeSaving(false);
    }
  }, [storeThemeDraft, storeThemeUpdatedBy]);

  const saveStoreDraft = async () => {
    await persistStoreDraft("manual");
  };

  const publishStoreTheme = async () => {
    setStoreThemePublishing(true);
    setStoreThemeError(null);
    setStoreThemeOk(null);
    try {
      const res = await fetch("/api/customer-account/store-theme/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: storeThemePublishComment,
          changedFields: storeThemeDiffRows.map((row) => row.label),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setStoreThemeError(data.error || "No se pudo publicar.");
        return;
      }
      setStoreThemeOk(data.message || "Cambios publicados.");
      setStoreThemePublishComment("");
      await loadStoreTheme();
    } finally {
      setStoreThemePublishing(false);
    }
  };

  const restoreStoreVersion = async (versionId: string) => {
    if (!versionId) return;
    setStoreThemeRestoring(versionId);
    setStoreThemeError(null);
    setStoreThemeOk(null);
    try {
      const res = await fetch("/api/customer-account/store-theme/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setStoreThemeError(data.error || "No se pudo restaurar la version.");
        return;
      }
      setStoreThemeOk(data.message || "Version cargada en borrador.");
      await loadStoreTheme();
    } finally {
      setStoreThemeRestoring(null);
    }
  };

  const setStoreThemeLocalPreview = useCallback((field: "logoUrl" | "backgroundImageUrl", nextUrl: string | null) => {
    setStoreThemeAssetLocalPreview((prev) => {
      const previousUrl = prev[field];
      if (previousUrl && previousUrl.startsWith("blob:") && previousUrl !== nextUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return { ...prev, [field]: nextUrl };
    });
  }, []);

  const handleStoreThemeAssetUpload = async (field: StoreThemeAssetField, file: File | null) => {
    if (!file || !storeThemeDraft) return;

    const validation = await validateStoreThemeAssetFile(field, file);
    if (!validation.ok) {
      setStoreThemeError(validation.error || "No se pudo validar el archivo.");
      return;
    }
    setStoreThemeAssetHint((prev) => ({ ...prev, [field]: validation.hint ?? null }));

    const localPreview = URL.createObjectURL(file);
    setStoreThemeLocalPreview(field, localPreview);
    setStoreThemeAssetUploading(field);
    setStoreThemeError(null);
    setStoreThemeOk(null);

    try {
      const url = await uploadImage(file, "tenant");
      setStoreThemeDraft((prev) => (prev ? { ...prev, [field]: url } : prev));
      setStoreThemeHasUnpublished(true);
      setStoreThemeOk("Imagen cargada en borrador. Se guardara automaticamente en breve.");
      setStoreThemeLocalPreview(field, null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir el archivo.";
      setStoreThemeError(message);
    } finally {
      setStoreThemeAssetUploading(null);
      setStoreThemeAssetDragOver((prev) => (prev === field ? null : prev));
    }
  };

  const restoreStoreThemeColorsFromProduction = () => {
    if (!storeThemeDraft || !storeThemePublished) return;
    setStoreThemeError(null);
    setStoreThemeDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        primaryColor: storeThemePublished.primaryColor,
        secondaryColor: storeThemePublished.secondaryColor,
        priceColor: storeThemePublished.priceColor,
        discountColor: storeThemePublished.discountColor,
        hoverColor: storeThemePublished.hoverColor,
        backgroundColor: storeThemePublished.backgroundColor,
      };
    });
    setStoreThemeHasUnpublished(true);
    setStoreThemeOk("Colores restaurados desde producción. Guarda borrador para conservarlos.");
  };

  const discardStoreThemeChanges = () => {
    if (!storeThemePublished) return;
    const shouldDiscard = window.confirm("Se descartaran tus cambios y el borrador volvera al estado actual de produccion. Deseas continuar?");
    if (!shouldDiscard) return;
    setStoreThemeError(null);
    setStoreThemeDraft(storeThemePublished);
    setStoreThemeOk("Borrador restaurado a produccion.");
    setStoreThemeHasUnpublished(false);
  };

  const applyStoreThemeTemplate = () => {
    if (!storeThemeDraft || !storeThemeSelectedTemplate) return;
    const template = STORE_THEME_TEMPLATES.find((item) => item.id === storeThemeSelectedTemplate);
    if (!template) return;
    setStoreThemeError(null);
    setStoreThemeDraft((prev) => (prev ? { ...prev, ...template.colors } : prev));
    setStoreThemeHasUnpublished(true);
    setStoreThemeOk(`Plantilla aplicada: ${template.name}.`);
  };

  const exportStoreThemeJson = () => {
    if (!storeThemeDraft) return;
    const json = JSON.stringify(storeThemeDraft, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `store-theme-${(company.publicSlug || company.id).toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    setStoreThemeOk("Tema exportado en JSON.");
  };

  const importStoreThemeJson = async (file: File | null) => {
    if (!file || !storeThemeDraft) return;
    setStoreThemeError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeStoreThemeInput(parsed, storeThemeDraft.displayName || company.name);
      setStoreThemeDraft(normalized);
      setStoreThemeHasUnpublished(true);
      setStoreThemeOk("Tema importado. Revisa la vista previa y guarda/publica cuando quieras.");
    } catch {
      setStoreThemeError("No se pudo importar el archivo JSON. Verifica el formato.");
    }
  };

  const handleTabChange = (nextTab: PortalTab) => {
    if (tab === "tienda" && nextTab !== "tienda" && storeThemeHasLocalUnsavedChanges) {
      const shouldLeave = window.confirm("Tienes cambios sin guardar en el editor de tienda. Deseas salir de todos modos?");
      if (!shouldLeave) return;
    }
    setTab(nextTab);
  };

  const applyStoreThemeContrastSuggestions = () => {
    if (!storeThemeContrastSuggestions.nextTheme) return;
    setStoreThemeError(null);
    setStoreThemeDraft(storeThemeContrastSuggestions.nextTheme);
    setStoreThemeHasUnpublished(true);
    setStoreThemeOk("Aplicamos sugerencias de contraste manteniendo tonos cercanos a tu elección.");
  };

  useEffect(() => {
    void loadRealtimeSnapshot();
    const id = window.setInterval(() => {
      void loadRealtimeSnapshot();
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadRealtimeSnapshot]);

  useEffect(() => {
    void loadStoreTheme();
  }, [loadStoreTheme]);

  useEffect(() => {
    return () => {
      [storeThemeAssetLocalPreview.logoUrl, storeThemeAssetLocalPreview.backgroundImageUrl].forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [storeThemeAssetLocalPreview.backgroundImageUrl, storeThemeAssetLocalPreview.logoUrl]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (tab !== "tienda" || !storeThemeHasLocalUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [storeThemeHasLocalUnsavedChanges, tab]);

  useEffect(() => {
    if (storeThemeAutosaveTimerRef.current) {
      clearTimeout(storeThemeAutosaveTimerRef.current);
      storeThemeAutosaveTimerRef.current = null;
    }

    if (!storeThemeDraft || storeThemeLoading || storeThemePublishing || storeThemeRestoring != null) {
      return;
    }

    if (storeThemeDraftSignature === storeThemeLastSavedSignature) {
      setStoreThemeAutosaveStatus("idle");
      return;
    }

    setStoreThemeAutosaveStatus("pending");
    storeThemeAutosaveTimerRef.current = setTimeout(() => {
      void persistStoreDraft("autosave");
    }, 2200);

    return () => {
      if (storeThemeAutosaveTimerRef.current) {
        clearTimeout(storeThemeAutosaveTimerRef.current);
        storeThemeAutosaveTimerRef.current = null;
      }
    };
  }, [
    persistStoreDraft,
    storeThemeDraft,
    storeThemeDraftSignature,
    storeThemeLastSavedSignature,
    storeThemeLoading,
    storeThemePublishing,
    storeThemeRestoring,
  ]);

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
          expiresAt: subscriptionEndsAt,
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
        `Monto: ${fmtMoney(payment.amount_paid, company.currency, company.locale)}`,
        `Estado actual: ${displayStatus(payment.status, PAYMENT_STATUS_LABELS)}`,
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
      displayStatus(payment.status, PAYMENT_STATUS_LABELS),
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

  if (!mounted) return null;

  return (
    <CustomerAccountShell
      companyName={company.name}
      activeTab={tab}
      onTabChange={handleTabChange}
      subscriptionStatusLabel={displayStatus(subscriptionStatus, SUBSCRIPTION_STATUS_LABELS)}
      lastRealtimeSyncAt={lastRealtimeSyncAt}
      formatSyncTime={fmtDate}
    >
      {tab === "resumen" ? (
        <AccountResumenTab
          company={company}
          subscriptionStatus={subscriptionStatus}
          subscriptionEndsAt={subscriptionEndsAt}
          activeEntitlementsCount={activeEntitlementsCount}
          activeBranchesCount={activeBranchesCount}
          openTicketsCount={openTicketsCount}
          branches={branches}
          tickets={tickets}
          latestPayment={latestPayment}
          accountAlerts={accountAlerts}
          expiryDays={expiryDays}
          cancellationScheduled={cancellationScheduled}
          filteredActivityTimeline={filteredActivityTimeline}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
          onNavigate={handleTabChange}
        />
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

      {tab === "tienda" ? (
        <AccountTiendaTab
          company={company}
          publicationStateLabel={publicationStateLabel}
          storeThemeUpdatedAt={storeThemeUpdatedAt}
          storeThemeUpdatedBy={storeThemeUpdatedBy}
          latestPublishedVersion={latestPublishedVersion}
          storeThemeAutosaveStatus={storeThemeAutosaveStatus}
          storeThemeHasLocalUnsavedChanges={storeThemeHasLocalUnsavedChanges}
          storeThemeAutosaveError={storeThemeAutosaveError}
          storeThemeError={storeThemeError}
          storeThemeOk={storeThemeOk}
          storeThemeLoading={storeThemeLoading}
          storeThemeDraft={storeThemeDraft}
          setStoreThemeDraft={setStoreThemeDraft}
          restoreStoreThemeColorsFromProduction={restoreStoreThemeColorsFromProduction}
          storeThemeSaving={storeThemeSaving}
          storeThemePublishing={storeThemePublishing}
          storeThemePublished={storeThemePublished}
          storeThemeAssetLocalPreview={storeThemeAssetLocalPreview}
          storeThemeAssetUploading={storeThemeAssetUploading}
          storeThemeAssetDragOver={storeThemeAssetDragOver}
          setStoreThemeAssetDragOver={setStoreThemeAssetDragOver}
          handleStoreThemeAssetUpload={handleStoreThemeAssetUpload}
          storeThemeAssetHint={storeThemeAssetHint}
          setStoreThemeHasUnpublished={setStoreThemeHasUnpublished}
          setStoreThemeLocalPreview={setStoreThemeLocalPreview}
          storeThemeChecklist={storeThemeChecklist}
          storeThemeContrastSuggestions={storeThemeContrastSuggestions}
          applyStoreThemeContrastSuggestions={applyStoreThemeContrastSuggestions}
          storeThemeDiffRows={storeThemeDiffRows}
          storeThemePublishComment={storeThemePublishComment}
          setStoreThemePublishComment={setStoreThemePublishComment}
          saveStoreDraft={saveStoreDraft}
          publishStoreTheme={publishStoreTheme}
          storeThemeHasUnpublished={storeThemeHasUnpublished}
          storeThemeChecklistBlockingIssues={storeThemeChecklistBlockingIssues}
          storePreviewTheme={storePreviewTheme}
          storeThemeVersions={storeThemeVersions}
          restoreStoreVersion={restoreStoreVersion}
          storeThemeRestoring={storeThemeRestoring}
          storeThemeSelectedTemplate={storeThemeSelectedTemplate}
          setStoreThemeSelectedTemplate={setStoreThemeSelectedTemplate}
          applyStoreThemeTemplate={applyStoreThemeTemplate}
          importStoreThemeJson={importStoreThemeJson}
          exportStoreThemeJson={exportStoreThemeJson}
          discardStoreThemeChanges={discardStoreThemeChanges}
        />
      ) : null}

      {tab === "plan" ? (
        <AccountPlanTab
          company={company}
          recommendedPlanOption={recommendedPlanOption}
          targetPlanId={targetPlanId}
          setTargetPlanId={setTargetPlanId}
          planMonthlyDelta={planMonthlyDelta}
          planAnnualDelta={planAnnualDelta}
          setPlanMonths={setPlanMonths}
          activeAddonRows={activeAddonRows}
          subscriptionEndsAt={subscriptionEndsAt}
          subscriptionCancelReason={subscriptionCancelReason}
          setSubscriptionCancelReason={setSubscriptionCancelReason}
          subscriptionCancelError={subscriptionCancelError}
          subscriptionCancelOk={subscriptionCancelOk}
          subscriptionCancelBusy={subscriptionCancelBusy}
          cancellationScheduled={cancellationScheduled}
          subscriptionReactivateBusy={subscriptionReactivateBusy}
          setSubscriptionCancelAcknowledge={setSubscriptionCancelAcknowledge}
          setSubscriptionCancelFinalConfirm={setSubscriptionCancelFinalConfirm}
          setSubscriptionCancelModalOpen={setSubscriptionCancelModalOpen}
          canReactivateCancellation={canReactivateCancellation}
          handleReactivateSubscription={handleReactivateSubscription}
          addonOfferMatrix={addonOfferMatrix}
          availablePlans={availablePlans}
          planPreview={planPreview}
          planPreviewLoading={planPreviewLoading}
          selectedPlanOption={selectedPlanOption}
          planMonths={planMonths}
          planMethodSlug={planMethodSlug}
          setPlanMethodSlug={setPlanMethodSlug}
          selectedPlanMethodOption={selectedPlanMethodOption}
          planReason={planReason}
          setPlanReason={setPlanReason}
          handlePlanRequest={handlePlanRequest}
          planChangeBusy={planChangeBusy}
          acknowledgedImpactIds={acknowledgedImpactIds}
          setAcknowledgedImpactIds={setAcknowledgedImpactIds}
          availableAddons={availableAddons}
          targetAddonId={targetAddonId}
          setTargetAddonId={setTargetAddonId}
          ownedAddonKeys={ownedAddonKeys}
          selectedAddonOption={selectedAddonOption}
          selectedAddonModeLabel={selectedAddonModeLabel}
          selectedAddonSingleInstance={selectedAddonSingleInstance}
          selectedAddonOwned={selectedAddonOwned}
          addonPreview={addonPreview}
          addonPreviewLoading={addonPreviewLoading}
          setAddonQty={setAddonQty}
          selectedAddonEffectiveQty={selectedAddonEffectiveQty}
          addonMonthsNumber={addonMonthsNumber}
          addonMonths={addonMonths}
          setAddonMonths={setAddonMonths}
          selectedAddonIsMonthly={selectedAddonIsMonthly}
          addonMethodSlug={addonMethodSlug}
          setAddonMethodSlug={setAddonMethodSlug}
          selectedAddonMethodOption={selectedAddonMethodOption}
          addonEstimatedUnit={addonEstimatedUnit}
          addonEstimatedTotal={addonEstimatedTotal}
          addonNotes={addonNotes}
          setAddonNotes={setAddonNotes}
          handleAddonRequest={handleAddonRequest}
          addonPurchaseBusy={addonPurchaseBusy}
          acknowledgedAddonImpactIds={acknowledgedAddonImpactIds}
          setAcknowledgedAddonImpactIds={setAcknowledgedAddonImpactIds}
          branchEntitlements={branchEntitlements}
        />
      ) : null}

      {tab === "sucursales" ? (
        <AccountSucursalesTab
          company={company}
          branches={branches}
          billingLoading={billingLoading}
          canRequestBranchWithoutPayment={canRequestBranchWithoutPayment}
          branchUnitPrice={branchUnitPrice}
          branchFlowStep={branchFlowStep}
          setBranchFlowStep={setBranchFlowStep}
          isProjectedCapacityInvalid={isProjectedCapacityInvalid}
          setBillingError={setBillingError}
          billingOptions={billingOptions}
          activeBranchesCount={activeBranchesCount}
          billingError={billingError}
          billingOk={billingOk}
          branchRequestName={branchRequestName}
          setBranchRequestName={setBranchRequestName}
          expansionBranchName={expansionBranchName}
          setExpansionBranchName={setExpansionBranchName}
          branchRequestAddress={branchRequestAddress}
          setBranchRequestAddress={setBranchRequestAddress}
          expansionBranchAddress={expansionBranchAddress}
          setExpansionBranchAddress={setExpansionBranchAddress}
          expansionQty={expansionQty}
          setExpansionQty={setExpansionQty}
          expansionMonths={expansionMonths}
          setExpansionMonths={setExpansionMonths}
          expansionMethodSlug={expansionMethodSlug}
          setExpansionMethodSlug={setExpansionMethodSlug}
          projectedActiveBranches={projectedActiveBranches}
          projectedEffectiveMaxBranches={projectedEffectiveMaxBranches}
          projectedRemainingBranches={projectedRemainingBranches}
          expansionQtyNumber={expansionQtyNumber}
          expansionMonthsNumber={expansionMonthsNumber}
          expansionAmount={expansionAmount}
          branchRequestNotes={branchRequestNotes}
          setBranchRequestNotes={setBranchRequestNotes}
          expansionNotes={expansionNotes}
          setExpansionNotes={setExpansionNotes}
          busy={busy}
          onBranchRequest={handleBranchRequest}
          onCreateExpansionPayment={handleCreateExpansionPayment}
          createdExpansionPayment={createdExpansionPayment}
          proofUploading={proofUploading}
          proofFileUrl={proofFileUrl}
          onUploadPaymentProof={handleUploadPaymentProof}
          onBranchWizardBack={handleBranchWizardBack}
          onBranchWizardNext={handleBranchWizardNext}
        />
      ) : null}

      {tab === "facturacion" ? (
        <AccountFacturacionTab
          company={company}
          billingPaidTotal={billingPaidTotal}
          billingPendingTotal={billingPendingTotal}
          pendingPaymentsCount={pendingPaymentsCount}
          latestPaidPaymentDate={latestPaidPaymentDate}
          paymentStatusFilter={paymentStatusFilter}
          setPaymentStatusFilter={setPaymentStatusFilter}
          paymentReferenceQuery={paymentReferenceQuery}
          setPaymentReferenceQuery={setPaymentReferenceQuery}
          paymentDateFrom={paymentDateFrom}
          setPaymentDateFrom={setPaymentDateFrom}
          paymentDateTo={paymentDateTo}
          setPaymentDateTo={setPaymentDateTo}
          filteredPayments={filteredPayments}
          createdExpansionPayment={createdExpansionPayment}
          onExportPaymentsCsv={handleExportPaymentsCsv}
          onOpenBillingSupport={handleOpenBillingSupport}
        />
      ) : null}

      {tab === "soporte" ? (
        <AccountSoporteTab
          company={company}
          busy={busy}
          supportSubject={supportSubject}
          setSupportSubject={setSupportSubject}
          supportCategory={supportCategory}
          setSupportCategory={setSupportCategory}
          supportPriority={supportPriority}
          setSupportPriority={setSupportPriority}
          supportDescription={supportDescription}
          setSupportDescription={setSupportDescription}
          onSupportTicket={handleSupportTicket}
          onApplySupportTemplate={handleApplySupportTemplate}
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={handleSelectTicket}
          selectedTicket={selectedTicket}
          messageLoading={messageLoading}
          messages={messages}
          messageDraft={messageDraft}
          setMessageDraft={setMessageDraft}
          onSendMessage={handleSendMessage}
        />
      ) : null}

      {subscriptionCancelModalOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/55 px-4 py-6 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Confirmar cancelacion al cierre del ciclo</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Tu tienda y panel seguiran operativos hasta la fecha de vencimiento actual. Al llegar esa fecha, el acceso se suspende.
            </p>
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
              <p><strong>Fecha de vencimiento:</strong> {fmtDate(subscriptionEndsAt)}</p>
              <p className="mt-1"><strong>Estado actual:</strong> {displayStatus(subscriptionStatus, SUBSCRIPTION_STATUS_LABELS)}</p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={subscriptionCancelAcknowledge}
                  onChange={(event) => setSubscriptionCancelAcknowledge(event.target.checked)}
                  className="mt-1"
                />
                Entiendo que no hay reembolso automático del periodo ya pagado.
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={subscriptionCancelFinalConfirm}
                  onChange={(event) => setSubscriptionCancelFinalConfirm(event.target.checked)}
                  className="mt-1"
                />
                Confirmo que quiero programar la cancelacion al cierre del ciclo.
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubscriptionCancelModalOpen(false)}
                className="h-11 rounded-xl border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                disabled={subscriptionCancelBusy}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={subscriptionCancelBusy || !subscriptionCancelAcknowledge || !subscriptionCancelFinalConfirm}
                className="h-11 rounded-xl border border-amber-300 bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600"
              >
                {subscriptionCancelBusy ? "Programando..." : "Confirmar cancelacion"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
        Soporte directo:{" "}
        <a className="font-medium text-blue-700 hover:underline dark:text-blue-400" href={`mailto:${company.supportEmail}`}>
          {company.supportEmail}
        </a>
      </div>
    </CustomerAccountShell>
  );
}
