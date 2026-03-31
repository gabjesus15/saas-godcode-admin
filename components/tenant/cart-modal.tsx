"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Banknote,
  Smartphone,
  DollarSign,
  Building,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  MapPin,
  // ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
  CupSoda,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

import { useCart } from "./use-cart";
import { ordersService } from "./orders-service";
import { validateImageFile } from "./utils/cloudinary";
import { getCloudinaryOptimizedUrl } from "./utils/cloudinary";
// import eliminado porque no se usa
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import {
  formatRutOnInput,
  normalizeChilePhoneInput,
  validateChileCustomerPhone,
  validateRutChile,
} from "../../utils/chile-forms";
import { sanitizeUserText } from "../../utils/sanitize-user-text";
import { mergeCartWithBranchPrices } from "./utils/cart-pricing";
import { formatCartMoney } from "./utils/format-cart-money";
import type { Json } from "../../types/supabase-database";
import { type CartFulfillment, isUpsellBeverageLineId } from "./cart-context";
import {
  effectiveDeliveryPricingMode,
  isOrderPaymentAllowedForDelivery,
  normalizeDeliverySettings,
  resolveDeliveryPaymentMethodsForCheckout,
  stripStaffOnlyDeliverySettings,
  type DeliveryNamedArea,
} from "../../lib/delivery-settings";
import { parseUnifiedAddressSearch } from "../../lib/address-search-query";
const DeliveryPreviewMap = dynamic(
  () =>
    import("./delivery-preview-map").then((mod) => mod.DeliveryPreviewMap),
  { ssr: false },
);

import "../../app/[subdomain]/styles/CartModal.css";
import "../../app/[subdomain]/styles/CartModal.custom.css";

type CartModalViewState = {
  showPaymentInfo: boolean;
  showPaymentMethods: boolean;
  showForm: boolean;
  showSuccess: boolean;
  isSaving: boolean;
  error: string | null;
  receiptUploadFailed: boolean;
  lastOrderSuccess: {
    id: number;
    order_number: number | null;
    handoff_code: string | null;
    fulfillment: CartFulfillment;
  } | null;
};

/** Coincide con `AddressGeocodeHit` / `GET /api/address-search` (Mapbox). */
type AddressSearchHit = {
  lat: number;
  lng: number;
  label: string;
  line1: string;
  commune: string;
  /** Resto de la dirección (región, CP, país). */
  detailLine?: string;
  /** Viene del servidor; sin valor se trata como aproximado. */
  precision?: "exact" | "approx";
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

/** Fallback catálogo carrito: bebidas (sin imagen propia) */
const ENHANCE_CATALOG_BEVERAGE_FALLBACK =
  "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80";
/** Fallback catálogo carrito: extras globales (sin imagen propia) */
const ENHANCE_CATALOG_EXTRA_FALLBACK =
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=200&q=80";

interface BranchInfo {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  company_id?: string | null;
  bank_name?: string | null;
  account_type?: string | null;
  account_number?: string | null;
  account_rut?: string | null;
  account_email?: string | null;
  account_holder?: string | null;
  payment_methods?: string[];
  pago_movil?: {
    banco?: string;
    telefono?: string;
    identificacion?: string;
  } | null;
  zelle?: {
    email?: string;
    name?: string;
  } | null;
  transferencia_bancaria?: {
    banco?: string;
    nro_cuenta?: string;
    tipo_cuenta?: string;
    identificacion?: string;
    titular?: string;
    email?: string;
  } | null;
  stripe?: { [key: string]: string } | null;
  mercadopago?: { [key: string]: string } | null;
  paypal?: { [key: string]: string } | null;
  delivery_settings?: Json | null;
  /** Flags/objetos configurados en admin para métodos presenciales. */
  efectivo?: unknown;
  tarjeta?: unknown;
  origin_lat?: number | null;
  origin_lng?: number | null;
}

interface BusinessInfo {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  schedule?: string | null;
  bank_name?: string | null;
  account_type?: string | null;
  account_number?: string | null;
  account_rut?: string | null;
  account_email?: string | null;
  account_holder?: string | null;
}

interface CartLineItem {
  id: string;
  lineId?: string;
  name?: string | null;
  image_url?: string | null;
  quantity: number;
  price?: number | null;
  has_discount?: boolean | null;
  discount_price?: number | null;
  description?: string | null;
  is_active?: boolean | null;
  selected_extras?: Array<{ id: string; name: string; price: number; qty: number }>;
  selected_beverages?: Array<{ id: string; name: string; price: number; qty: number }>;
  line_summary?: string | null;
}

// Tipo unificado para manejar la información activa
type ActiveSessionInfo = BusinessInfo & Partial<BranchInfo>;

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: ComponentType<LucideProps>; isOnline: boolean }> = {
  efectivo: { label: "Efectivo", icon: Banknote, isOnline: false },
  tarjeta: { label: "Tarjeta (Presencial)", icon: CreditCard, isOnline: false },
  pago_movil: { label: "Pago Móvil", icon: Smartphone, isOnline: true },
  zelle: { label: "Zelle", icon: DollarSign, isOnline: true },
  transferencia_bancaria: { label: "Transferencia", icon: Building, isOnline: true },
  stripe: { label: "Tarjeta (Online)", icon: CreditCard, isOnline: true },
  mercadopago: { label: "MercadoPago", icon: CreditCard, isOnline: true },
  paypal: { label: "PayPal", icon: DollarSign, isOnline: true },
};

type WsFulfillmentMeta = {
  fulfillment: CartFulfillment;
  cartSubtotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliverySummary?: string;
  orderId?: number | null;
  orderNumber?: number | null;
  handoffCode?: string | null;
};

const generateWSMessage = (
  formData: { name: string; rut: string; phone: string },
  cart: Array<{ name?: string | null; quantity: number; description?: string | null }>,
  grandTotal: number,
  paymentMethodKey: string | null,
  note: string,
  businessName?: string | null,
  paymentData?: unknown,
  meta?: WsFulfillmentMeta
) => {
  let msg = `*NUEVO PEDIDO WEB - ${businessName || "RESTAURANTE"}*\n`;
  msg += "================================\n\n";
  msg += `Cliente: ${formData.name}\n`;
  msg += `RUT: ${formData.rut}\n`;
  msg += `Fono: ${formData.phone}\n\n`;
  if (meta) {
    msg += `Tipo: ${meta.fulfillment === "delivery" ? "DELIVERY" : "RETIRO EN LOCAL"}\n`;
    if (meta.fulfillment === "delivery" && meta.deliverySummary) {
      msg += `${meta.deliverySummary}\n`;
    }
    if (meta.fulfillment === "delivery" && meta.deliveryFee > 0) {
      msg += `Envio: $${formatCartMoney(meta.deliveryFee)}\n`;
    }
    msg += `Subtotal productos: $${formatCartMoney(meta.cartSubtotal)}\n`;
    if (meta.orderNumber != null) msg += `N° pedido: #${meta.orderNumber}\n`;
    else if (meta.orderId != null) msg += `ID pedido: ${meta.orderId}\n`;
    if (meta.handoffCode) msg += `Codigo de entrega: ${meta.handoffCode}\n`;
    msg += "\n";
  }
  msg += "DETALLE:\n";
  cart.forEach((item) => {
    msg += `+ ${item.quantity} x ${(item.name ?? "").toUpperCase()}\n`;
    if (item.description) {
      msg += `   (Hacer: ${item.description})\n`;
    }
  });
  msg += `\n*TOTAL: $${formatCartMoney(grandTotal)}*\n`;
  const methodLabel = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey] ? PAYMENT_METHOD_CONFIG[paymentMethodKey].label : "Por definir";
  msg += `Pago: ${methodLabel}\n`;

  if (paymentMethodKey === "transferencia_bancaria" && paymentData) {
    const td = paymentData as Record<string, unknown>;
    const banco = typeof td.banco === "string" ? td.banco : "";
    const nroCuenta = typeof td.nro_cuenta === "string" ? td.nro_cuenta : "";
    const tipoCuenta = typeof td.tipo_cuenta === "string" ? td.tipo_cuenta : "";
    const titular = typeof td.titular === "string" ? td.titular : "";
    msg += `\n*Transferencia bancaria*\n`;
    if (banco) msg += `Banco: ${banco}\n`;
    if (tipoCuenta) msg += `Tipo: ${tipoCuenta}\n`;
    if (nroCuenta) msg += `Cuenta: ${nroCuenta}\n`;
    if (titular) msg += `Titular: ${titular}\n`;
    msg += `\nCuando completes la transferencia, respondé este WhatsApp con el monto y la hora (no hace falta enviar comprobante).\n`;
  }

  if (note && note.trim()) msg += `\nNota: ${note}\n`;
  return msg;
};

function parseOrderRpcPayload(data: unknown): {
  id: number;
  order_number: number | null;
  handoff_code: string | null;
} | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;
  const order_number =
    o.order_number != null && o.order_number !== ""
      ? Number(o.order_number)
      : null;
  const handoff_code = typeof o.handoff_code === "string" ? o.handoff_code : null;
  return {
    id,
    order_number: order_number != null && Number.isFinite(order_number) ? order_number : null,
    handoff_code,
  };
}

/** Listbox temático: el `<select>` nativo no permite teñir el highlight del OS (azul). */
function CartNamedAreaSelect({
  areas,
  value,
  onPick,
  formatMoney,
}: {
  areas: DeliveryNamedArea[];
  value: string | null;
  onPick: (id: string | null) => void;
  formatMoney: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = value ? areas.find((a) => a.id === value) : undefined;

  return (
    <div className={`cart-named-area-select${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`cart-named-area-select-trigger form-input ${open ? "is-open" : ""}`}
        aria-labelledby="cart-named-area-label"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cart-named-area-select-value">
          {selected
            ? `${selected.name} — $${formatMoney(selected.feeFlat)}`
            : "Elegi una zona"}
        </span>
        <ChevronDown
          size={18}
          className="cart-named-area-select-chevron"
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="cart-named-area-select-list" role="listbox">
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`cart-named-area-select-option ${!value ? "is-active" : ""}`}
              onClick={() => {
                onPick(null);
                setOpen(false);
              }}
            >
              Elegi una zona
            </button>
          </li>
          {areas.map((a) => (
            <li key={a.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === a.id}
                className={`cart-named-area-select-option ${
                  value === a.id ? "is-active" : ""
                }`}
                onClick={() => {
                  onPick(a.id);
                  setOpen(false);
                }}
              >
                {a.name} — ${formatMoney(a.feeFlat)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CartModal({
  businessInfo,
  selectedBranch,
}: {
  businessInfo?: BusinessInfo | null;
  selectedBranch?: BranchInfo | null;
}) {
    // const router = useRouter(); // No usado
    // const pathname = usePathname(); // No usado
    const supabase = useMemo(() => createSupabaseBrowserClient("tenant"), []);
    // homePath eliminado porque no se usa y generaba error de sintaxis

    const {
      cart,
      isCartOpen,
      toggleCart,
      addToCart,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      cartSubtotal,
      grandTotal,
      deliveryFee,
      getPrice,
      orderNote,
      setOrderNote,
      fulfillment,
      setFulfillment,
      deliveryLine1,
      setDeliveryLine1,
      deliveryCommune,
      setDeliveryCommune,
      deliveryReference,
      setDeliveryReference,
      setDeliveryCoords,
      deliveryLat,
      deliveryLng,
      isDeliveryOutOfZone,
      quotedRouteKm,
      deliveryNamedAreaId,
      setDeliveryNamedAreaId,
      deliveryKmManual,
      setDeliveryKmManual,
      setShowDeliveryReference,
      deliveryWaivedFree,
      deliveryNamedAreaLabel,
      deliveryQuoteLoading,
      deliveryQuoteError,
      globalExtras,
      setGlobalExtras,
      extrasEnabledByBranch,
      beveragesUpsellEnabledByBranch,
    } = useCart();

    type CheckoutLiveBranch = Pick<
      BranchInfo,
      "payment_methods" | "delivery_settings" | "efectivo" | "tarjeta"
    >;

    const [checkoutLiveBranch, setCheckoutLiveBranch] = useState<CheckoutLiveBranch | null>(
      null,
    );

    const selectedBranchForCheckout = useMemo<BranchInfo | null>(() => {
      if (!selectedBranch) return null;
      if (!checkoutLiveBranch) return selectedBranch;
      return { ...selectedBranch, ...checkoutLiveBranch } as BranchInfo;
    }, [selectedBranch, checkoutLiveBranch]);

    // Real-time: mantener actualizados los métodos de pago (y restricción delivery) del checkout
    // cuando el admin edita la sucursal en el panel.
    useEffect(() => {
      if (!selectedBranch?.id) {
        queueMicrotask(() => setCheckoutLiveBranch(null));
        return;
      }

      const channel = supabase
        .channel(`tenant-cart-checkout-branch:${selectedBranch.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "branches",
            filter: `id=eq.${selectedBranch.id}`,
          },
          (payload: unknown) => {
            const next = (payload as { new?: unknown }).new;
            if (!next || typeof next !== "object") return;
            const row = next as Record<string, unknown>;
            setCheckoutLiveBranch({
              payment_methods:
                row.payment_methods === null
                  ? undefined
                  : (row.payment_methods as string[] | undefined),
              delivery_settings: row.delivery_settings as Json | null | undefined,
              efectivo: row.efectivo,
              tarjeta: row.tarjeta,
            });
          },
        );

      channel.subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [supabase, selectedBranch?.id]);

    const deliverySettings = useMemo(
      () =>
        normalizeDeliverySettings(
          stripStaffOnlyDeliverySettings(selectedBranchForCheckout?.delivery_settings),
        ),
      [selectedBranchForCheckout]
    );

    const branchPaymentMethods = useMemo(() => {
      const base = Array.isArray(selectedBranchForCheckout?.payment_methods)
        ? [...selectedBranchForCheckout!.payment_methods]
        : [];

      const hasEfectivo = (() => {
        const v = selectedBranchForCheckout?.efectivo;
        if (v == null) return false;
        if (typeof v === "string") {
          const t = v.trim();
          if (!t) return false;
          // Si viene serializado como JSON vacío "{}", no lo consideramos activo.
          try {
            const parsed = JSON.parse(t);
            if (parsed && typeof parsed === "object" && Object.keys(parsed as Record<string, unknown>).length === 0) {
              return false;
            }
          } catch {
            // Si no es JSON, al menos que no sea el string "{}".
            if (t === "{}") return false;
          }
          return true;
        }
        if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length > 0;
        return true;
      })();

      const hasTarjeta = (() => {
        const v = selectedBranchForCheckout?.tarjeta;
        if (v == null) return false;
        if (typeof v === "string") {
          const t = v.trim();
          if (!t) return false;
          try {
            const parsed = JSON.parse(t);
            if (parsed && typeof parsed === "object" && Object.keys(parsed as Record<string, unknown>).length === 0) {
              return false;
            }
          } catch {
            if (t === "{}") return false;
          }
          return true;
        }
        if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length > 0;
        return true;
      })();

      if (hasEfectivo && !base.includes("efectivo")) base.push("efectivo");
      if (hasTarjeta && !base.includes("tarjeta")) base.push("tarjeta");

      return Array.from(new Set(base));
    }, [selectedBranchForCheckout]);

    const checkoutPaymentMethods = useMemo(
      () =>
        resolveDeliveryPaymentMethodsForCheckout(
          branchPaymentMethods,
          deliverySettings,
          fulfillment,
        ),
      [branchPaymentMethods, deliverySettings, fulfillment],
    );

    const deliveryPriceMode = useMemo(
      () => effectiveDeliveryPricingMode(deliverySettings),
      [deliverySettings]
    );

    const [activeEnhancePanel, setActiveEnhancePanel] = useState<
      "none" | "beverages" | "extras"
    >("none");

    const enhancementCatalogs = useMemo(() => {
      const raw =
        selectedBranchForCheckout?.delivery_settings &&
        typeof selectedBranchForCheckout.delivery_settings === "object" &&
        !Array.isArray(selectedBranchForCheckout.delivery_settings)
          ? (selectedBranchForCheckout.delivery_settings as Record<string, unknown>)
          : {};
      const parseRows = (x: unknown) =>
        Array.isArray(x)
          ? x
              .filter((r) => r && typeof r === "object")
              .map((r) => {
                const o = r as Record<string, unknown>;
                const rawImg = o.image_url ?? o.imageUrl;
                const imageUrl =
                  typeof rawImg === "string" && rawImg.trim().length > 0
                    ? rawImg.trim()
                    : null;
                return {
                  id: String(o.id ?? ""),
                  name: String(o.name ?? ""),
                  price: Math.max(0, Math.round(Number(o.price) || 0)),
                  image_url: imageUrl,
                };
              })
              .filter((r) => r.id && r.name)
          : [];
      return {
        beverages: parseRows(raw.cartBeveragesCatalog ?? raw.beveragesCatalog),
        globalExtras: parseRows(raw.cartGlobalExtrasCatalog ?? raw.globalExtrasCatalog),
      };
    }, [selectedBranchForCheckout]);

    const [geoHint, setGeoHint] = useState<string | null>(null);
    // Modo simple: no mostramos autocompletado visual de direcciones.
    // Aun así, geocodificamos en background para obtener lat/lng.
    const SHOW_ADDRESS_SUGGESTIONS = false;

    const [addressHits, setAddressHits] = useState<AddressSearchHit[]>([]);
    const [addressSearchConfigError, setAddressSearchConfigError] = useState<
      string | null
    >(null);
    const [addressSearchLoading, setAddressSearchLoading] = useState(false);
    const [addressHitsOpen, setAddressHitsOpen] = useState(false);
    const addressSearchWrapRef = useRef<HTMLDivElement>(null);
    /** Precisión del punto de entrega (búsqueda vs GPS). */
    const [deliveryAddressPrecision, setDeliveryAddressPrecision] = useState<
      "exact" | "approx" | null
    >(null);
    /** Evita geocodificar por calle/comuna justo después de elegir sugerencia o GPS. */
    const suppressLineGeocodeUntilRef = useRef(0);
    const [lineGeocodeLoading, setLineGeocodeLoading] = useState(false);
    const [debouncedDeliveryLine, setDebouncedDeliveryLine] = useState({
      line1: "",
      commune: "",
    });

    /** Un solo campo: búsqueda + relleno de calle/comuna al elegir sugerencia. */
    const [unifiedAddressSearch, setUnifiedAddressSearch] = useState("");
    const [debouncedLookup, setDebouncedLookup] = useState("");
    const cartWasOpenRef = useRef(false);

    // 3 campos separados: Comuna + Calle + Número.
    // `deliveryLine1` en el store se compone como: `${street} ${number}`.
    const [streetInput, setStreetInput] = useState("");
    const [streetNumberInput, setStreetNumberInput] = useState("");

    function splitLine1IntoStreetAndNumber(line1: string): {
      street: string;
      number: string;
    } {
      const t = line1.trim();
      if (!t) return { street: "", number: "" };
      // Si viene con cosas tipo "..., depto 4", nos quedamos con lo antes de la coma.
      const beforeComma = t.split(",")[0].trim();
      // Toma el último número al final de la cadena.
      const m = beforeComma.match(/^(.*?)(\d+[A-Za-z]?)\s*$/);
      if (!m) return { street: t, number: "" };
      return { street: (m[1] ?? "").trim(), number: (m[2] ?? "").trim() };
    }

    // Mantener inputs sincronizados si `deliveryLine1` se setea desde GPS / geocoding.
    useEffect(() => {
      const { street, number } = splitLine1IntoStreetAndNumber(deliveryLine1);
      queueMicrotask(() => {
        setStreetInput(street);
        setStreetNumberInput(number);
      });
    }, [deliveryLine1]);

    useEffect(() => {
      const wasOpen = cartWasOpenRef.current;
      cartWasOpenRef.current = isCartOpen;
      if (!isCartOpen || deliveryPriceMode !== "distance") return;
      if (wasOpen) return;
      const merged = [deliveryLine1.trim(), deliveryCommune.trim()]
        .filter(Boolean)
        .join(", ");
      queueMicrotask(() => setUnifiedAddressSearch(merged));
    }, [isCartOpen, deliveryPriceMode, deliveryLine1, deliveryCommune]);

    useEffect(() => {
      if (!isCartOpen) return;
      const t = window.setTimeout(() => {
        const v = unifiedAddressSearch.trim();
        setDebouncedLookup(v);
        // En modo distancia con campos separados (comuna/calle/número),
        // no volver a parsear el string unificado para evitar "pisar" inputs.
        // Caso típico: escribir solo "Ñuñoa" en comuna terminaba moviéndolo a calle.
        if (deliveryPriceMode === "distance" && !SHOW_ADDRESS_SUGGESTIONS) {
          return;
        }
        const { line1, commune } = parseUnifiedAddressSearch(unifiedAddressSearch);
        setDeliveryLine1(line1);
        setDeliveryCommune(commune);
      }, 420);
      return () => window.clearTimeout(t);
    }, [
      unifiedAddressSearch,
      isCartOpen,
      deliveryPriceMode,
      SHOW_ADDRESS_SUGGESTIONS,
      setDeliveryLine1,
      setDeliveryCommune,
    ]);

    useEffect(() => {
      const t = window.setTimeout(() => {
        setDebouncedDeliveryLine({
          line1: deliveryLine1.trim(),
          commune: deliveryCommune.trim(),
        });
      }, 520);
      return () => clearTimeout(t);
    }, [deliveryLine1, deliveryCommune]);

    useEffect(() => {
      if (deliveryPriceMode !== "distance") return;
      const q = debouncedLookup.trim();
      if (q.length < 3) {
        const clearT = window.setTimeout(() => {
          setAddressHits([]);
          setAddressSearchConfigError(null);
          setAddressSearchLoading(false);
        }, 0);
        return () => clearTimeout(clearT);
      }
      let cancelled = false;
      const loadT = window.setTimeout(() => {
        if (!cancelled) setAddressSearchLoading(true);
      }, 0);
      const params = new URLSearchParams({ q });
      const { commune: hint } = parseUnifiedAddressSearch(q);
      if (hint.length >= 2) {
        params.set("communeHint", hint);
      }
      if (selectedBranch?.id) {
        params.set("branchId", selectedBranch.id);
      }
      if (selectedBranch?.origin_lat != null && selectedBranch?.origin_lng != null) {
        const olat = Number(selectedBranch.origin_lat);
        const olng = Number(selectedBranch.origin_lng);
        if (Number.isFinite(olat) && Number.isFinite(olng)) {
          params.set("nearLat", String(olat));
          params.set("nearLon", String(olng));
        }
      }
      fetch(`/api/address-search?${params}`)
        .then(async (r) => {
          if (cancelled) return;
          const j = (await r.json().catch(() => ({}))) as {
            ok?: boolean;
            results?: AddressSearchHit[];
            code?: string;
          };
          if (r.status === 503) {
            setAddressSearchConfigError(
              "Servicio de direcciones no disponible. Intenta más tarde."
            );
            setAddressHits([]);
            return;
          }
          const results = Array.isArray(j.results) ? j.results : [];
          setAddressSearchConfigError(null);
          setAddressHits(results);

          if (!SHOW_ADDRESS_SUGGESTIONS && results[0]) {
            const first = results[0];
            if (Date.now() >= suppressLineGeocodeUntilRef.current) {
              suppressLineGeocodeUntilRef.current = Date.now() + 850;
              setDeliveryCoords(first.lat, first.lng);
              setDeliveryAddressPrecision(
                first.precision === "exact" ? "exact" : "approx"
              );
              setGeoHint("Dirección encontrada. Revisa el costo de envío.");
              setShowDeliveryReference(true);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAddressHits([]);
            setAddressSearchConfigError(null);
          }
        })
        .finally(() => {
          if (!cancelled) setAddressSearchLoading(false);
        });
      return () => {
        cancelled = true;
        clearTimeout(loadT);
      };
    }, [
      debouncedLookup,
      deliveryPriceMode,
      selectedBranch?.id,
      selectedBranch?.origin_lat,
      selectedBranch?.origin_lng,
      SHOW_ADDRESS_SUGGESTIONS,
      setDeliveryCoords,
      setShowDeliveryReference,
    ]);

    useEffect(() => {
      function onDoc(e: MouseEvent) {
        if (!addressHitsOpen) return;
        const el = addressSearchWrapRef.current;
        if (el && !el.contains(e.target as Node)) setAddressHitsOpen(false);
      }
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [addressHitsOpen]);

    /** Si el cliente completa el número en calle/comuna, recalculamos coordenadas y el envío. */
    useEffect(() => {
      if (deliveryPriceMode !== "distance") return;
      if (fulfillment !== "delivery") return;
      if (Date.now() < suppressLineGeocodeUntilRef.current) return;

      const rawLine = debouncedDeliveryLine.line1;
      const rawCommune = debouncedDeliveryLine.commune;
      if (rawLine.length < 4 || rawCommune.length < 2) return;
      if (!/\d/.test(rawLine)) return;

      const q =
        rawLine.trim().length >= 3
          ? rawLine.trim()
          : [rawLine.trim(), rawCommune.trim()].filter(Boolean).join(", ");
      if (q.length < 4) return;

      let cancelled = false;
      const loadT = window.setTimeout(() => {
        if (!cancelled) setLineGeocodeLoading(true);
      }, 0);

      const params = new URLSearchParams({ q });
      if (rawCommune.length >= 2) {
        params.set("communeHint", rawCommune.trim());
      }
      if (selectedBranch?.id) {
        params.set("branchId", selectedBranch.id);
      }
      if (selectedBranch?.origin_lat != null && selectedBranch?.origin_lng != null) {
        const olat = Number(selectedBranch.origin_lat);
        const olng = Number(selectedBranch.origin_lng);
        if (Number.isFinite(olat) && Number.isFinite(olng)) {
          params.set("nearLat", String(olat));
          params.set("nearLon", String(olng));
        }
      }

      fetch(`/api/address-search?${params}`)
        .then((r) => r.json())
        .then((j: { results?: AddressSearchHit[] }) => {
          if (cancelled) return;
          const first = Array.isArray(j.results) ? j.results[0] : undefined;
          if (!first) return;
          setDeliveryCoords(first.lat, first.lng);
          setDeliveryAddressPrecision(
            first.precision === "exact" ? "exact" : "approx"
          );
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) {
            window.setTimeout(() => setLineGeocodeLoading(false), 0);
          }
        });

      return () => {
        cancelled = true;
        clearTimeout(loadT);
      };
    }, [
      debouncedDeliveryLine,
      deliveryPriceMode,
      fulfillment,
      selectedBranch?.id,
      selectedBranch?.origin_lat,
      selectedBranch?.origin_lng,
      setDeliveryCoords,
    ]);

    // --- Lógica para filtrar productos desactivados y actualizar precios ---
    const [filteredCart, setFilteredCart] = useState<CartLineItem[]>(cart);
    const cartProductIds = useMemo(
      () => Array.isArray(cart)
        ? Array.from(new Set(cart.map((item) => String(item.id || "")).filter(Boolean))).join(",")
        : "",
      [cart]
    );

    useEffect(() => {
      if (!cartProductIds || !selectedBranch?.id) {
        return;
      }
      let cancelled = false;
      const validatePrices = async () => {
        const ids = cartProductIds.split(",").filter(Boolean);
        // ...existing code...
        if (ids.length === 0) return;
        try {
          const { data, error } = await supabase
            .from("product_prices")
            .select("product_id, price, has_discount, discount_price, products(id,name,is_active,description)")
            .in("product_id", ids)
            .eq("branch_id", selectedBranch.id);
          if (cancelled) return;
          if (error) {
            console.log("[CartModal] Error en supabase product_prices:", error);
            setFilteredCart(cart);
            return;
          }
          // ...existing code...
          const next = mergeCartWithBranchPrices(cart, data ?? [], {
            omitLinesWithoutPriceWhenBranchHasData: true,
          });
          // ...existing code...
          setFilteredCart(next);
        } catch {
          // ...existing code...
          if (!cancelled) {
            setFilteredCart(cart);
          }
        }
      };
      validatePrices();
      return () => {
        cancelled = true;
      };
    }, [cart, cartProductIds, selectedBranch?.id, supabase]);

    // --- Fin lógica filtrado ---

    // Detectar productos eliminados al cambiar de sucursal
    // const [removedProducts, setRemovedProducts] = useState<string[]>([]);
    // useEffect(() => {
    //   // Buscar en localStorage si hay productos eliminados
    //   const storage = localStorage.getItem("tenant_cart_storage");
    //   if (storage) {
    //     try {
    //       const parsed = JSON.parse(storage);
    //       if (parsed.removedProducts && Array.isArray(parsed.removedProducts)) {
    //         setRemovedProducts(parsed.removedProducts);
    //         localStorage.removeItem("tenant_cart_storage_removed");
    //       }
    //     } catch {}
    //   }
    // }, [selectedBranch]);

  const [viewState, setViewState] = useState<CartModalViewState>({
    showPaymentInfo: false,
    showPaymentMethods: false,
    showForm: false,
    showSuccess: false,
    isSaving: false,
    error: null,
    receiptUploadFailed: false,
    lastOrderSuccess: null,
  });

  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [paymentMethodKey, setPaymentMethodKey] = useState<string | null>(null);
  const fulfillmentScrollRef = useRef<HTMLDivElement | null>(null);
  const fulfillmentChoiceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isCartOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (!paymentMethodKey) return;
    if (checkoutPaymentMethods.length === 0) {
      queueMicrotask(() => setPaymentMethodKey(null));
      return;
    }
    if (!checkoutPaymentMethods.includes(paymentMethodKey)) {
      queueMicrotask(() => setPaymentMethodKey(null));
    }
  }, [paymentMethodKey, checkoutPaymentMethods]);

  // Zod schema para validación robusta
    const clientSchema = z.object({
      name: z.string()
        .min(3, "Nombre muy corto")
        .max(50)
        .regex(/^[\p{L} .'-]+$/u, "Nombre inválido"),
      phone: z.string(), // Validación desactivada temporalmente
      rut: z.string(), // Validación desactivada temporalmente
      receiptFile: z.any().optional(),
      receiptPreview: z.string().optional(),
    });

  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "+56 9 ",
      rut: "",
      receiptFile: null,
      receiptPreview: undefined,
    },
  });
     // Prellenar datos desde localStorage solo en cliente
     useEffect(() => {
       if (typeof window !== "undefined") {
         const phone = localStorage.getItem("tenant_client_phone");
         const rut = localStorage.getItem("tenant_client_rut");
         if (phone) form.setValue("phone", phone);
         if (rut) form.setValue("rut", rut);
       }
     }, [form]);

  const { handleSubmit, setValue, getValues, control } = form;
  const formValues = useWatch({ control });
    const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(true);
  const selectedBranchId = selectedBranch?.id ?? null;

  useEffect(() => {
    if (!selectedBranchId) {
      Promise.resolve().then(() => {
        setIsShiftOpen(false);
        setIsShiftLoading(false);
      });
      return;
    }

    let cancelled = false;

    const checkShiftStatus = async () => {
      setIsShiftLoading(true);
      const { data, error } = await supabase
        .from("cash_shifts")
        .select("id")
        .eq("status", "open")
        .eq("branch_id", selectedBranchId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setIsShiftOpen(false);
        setIsShiftLoading(false);
        return;
      }

      setIsShiftOpen(Boolean(data));
      setIsShiftLoading(false);
    };

    Promise.resolve().then(() => {
      checkShiftStatus().catch(() => {
        if (!cancelled) {
          setIsShiftOpen(false);
          setIsShiftLoading(false);
        }
      });
    });

    const channel = supabase
      .channel(`cart-shift-realtime:${selectedBranchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cash_shifts",
          filter: `branch_id=eq.${selectedBranchId}`,
        },
        () => {
          checkShiftStatus().catch(() => {
            if (!cancelled) setIsShiftOpen(false);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedBranchId, supabase]);

  const canCheckout = isShiftOpen;

  const minOrder = deliverySettings.minOrderSubtotal ?? 0;
  const MIN_DRIVER_REFERENCE_LEN = 6;
  const meetsMinDelivery =
    fulfillment !== "delivery" || cartSubtotal + 1e-9 >= minOrder;
  const hasDeliveryCoords =
    deliveryLat != null &&
    deliveryLng != null &&
    Number.isFinite(deliveryLat) &&
    Number.isFinite(deliveryLng);
  const deliveryAddressOk =
    fulfillment !== "delivery" ||
    (deliveryLine1.trim().length >= 4 &&
      (deliveryCommune.trim().length >= 2 || hasDeliveryCoords));
  const deliveryReferenceOk =
    fulfillment !== "delivery" ||
    deliveryReference.trim().length >= MIN_DRIVER_REFERENCE_LEN;

  const namedManualOk =
    deliveryPriceMode !== "named" ||
    deliverySettings.namedAreaResolution !== "manual_select" ||
    Boolean(deliveryNamedAreaId?.trim());

  const addressMatchedOk =
    deliveryPriceMode !== "named" ||
    deliverySettings.namedAreaResolution !== "address_matched" ||
    (deliveryAddressOk &&
      !deliveryQuoteLoading &&
      !deliveryQuoteError &&
      deliveryNamedAreaLabel != null);

  function isValidCoordsForQuote() {
    const lat = deliveryLat;
    const lng = deliveryLng;
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    );
  }

  function kmManualValid() {
    const n = Number(String(deliveryKmManual).replace(",", "."));
    return Number.isFinite(n) && n >= 0;
  }

  const distanceReady =
    deliveryPriceMode !== "distance" ||
    (!isDeliveryOutOfZone &&
      !deliveryQuoteError &&
      (isValidCoordsForQuote()
        ? !deliveryQuoteLoading
        : kmManualValid()));

  const canProceedFulfillment =
    fulfillment !== "delivery" ||
    (deliveryAddressOk &&
      meetsMinDelivery &&
      deliveryReferenceOk &&
      namedManualOk &&
      addressMatchedOk &&
      distanceReady);

  const checkoutPhase = useMemo((): "summary" | "fulfillment" | "payment" => {
    if (!viewState.showPaymentInfo) return "summary";
    if (!viewState.showPaymentMethods) return "fulfillment";
    return "payment";
  }, [viewState.showPaymentInfo, viewState.showPaymentMethods]);

  const isDeliveryFulfillmentFocus =
    viewState.showPaymentInfo &&
    !viewState.showPaymentMethods &&
    fulfillment === "delivery" &&
    deliverySettings.enabled;

  const requestDeliveryGeo = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoHint("Tu navegador no permite ubicacion. Escribi la direccion.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoHint(
        "La ubicacion solo funciona en HTTPS (o localhost). Abrí el sitio con https o desde produccion."
      );
      return;
    }
    setGeoHint("Buscando ubicacion...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDeliveryCoords(lat, lng);
        setDeliveryAddressPrecision("exact");
        setGeoHint("Buscando direccion...");
        fetch(
          `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { line1?: string; commune?: string } | null) => {
            const l1 = data?.line1?.trim() ?? "";
            const com = data?.commune?.trim() ?? "";
            if (l1) setDeliveryLine1(l1);
            if (com) setDeliveryCommune(com);
            if (l1 || com) {
              setUnifiedAddressSearch([l1, com].filter(Boolean).join(", "));
            }
            suppressLineGeocodeUntilRef.current = Date.now() + 1200;
            setGeoHint(
              "Ubicacion guardada. Revisa calle, comuna y el costo de envio."
            );
            setShowDeliveryReference(true);
          })
          .catch(() => {
            suppressLineGeocodeUntilRef.current = Date.now() + 1200;
            setGeoHint(
              "Ubicacion guardada. Completa calle y comuna a mano si no se rellenaron."
            );
            setShowDeliveryReference(true);
          });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoHint(
            "Permiso denegado. En el candado del navegador, permiti ubicacion para este sitio."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoHint("No hay señal de ubicacion. Escribi calle y comuna.");
        } else if (err.code === err.TIMEOUT) {
          setGeoHint("Tiempo agotado. Proba de nuevo o escribi la direccion.");
        } else {
          setGeoHint("No pudimos leer tu ubicacion. Escribi calle y comuna.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [
    setDeliveryCoords,
    setDeliveryLine1,
    setDeliveryCommune,
    setShowDeliveryReference,
    setUnifiedAddressSearch,
  ]);

  const selectAddressSearchHit = useCallback(
    (hit: AddressSearchHit) => {
      suppressLineGeocodeUntilRef.current = Date.now() + 850;
      const { commune: userCommuneFromField } = parseUnifiedAddressSearch(
        unifiedAddressSearch,
      );
      const communeFromDetail = (): string => {
        const d = hit.detailLine?.trim();
        if (!d) return "";
        const parts = d.split(",").map((s) => s.trim());
        const first = parts[0] ?? "";
        if (/^región\b/i.test(first)) {
          return (parts[1] ?? "").slice(0, 120);
        }
        return first.length >= 2 ? first.slice(0, 120) : "";
      };
      const comFromHit = hit.commune?.trim() || communeFromDetail();
      const com =
        userCommuneFromField.trim().length >= 2
          ? userCommuneFromField.trim().slice(0, 120)
          : comFromHit;
      const pickStreetLineFromLabel = (label: string | undefined): string => {
        if (!label?.trim()) return "";
        const parts = label.split(",").map((s) => s.trim());
        for (const p of parts) {
          if (
            /\d/.test(p) &&
            /(av|avenida|calle|pasaje|vicuña|paseo|camino|n°|número)/i.test(p)
          ) {
            return p.slice(0, 200);
          }
        }
        for (const p of parts) {
          if (/\d/.test(p) && p.length >= 4) return p.slice(0, 200);
        }
        return "";
      };
      const userTypedDigits = /\d/.test(unifiedAddressSearch);
      let line1 =
        hit.line1?.trim() ||
        (hit.label?.split(",")[0]?.trim() ?? "").slice(0, 200);
      if (userTypedDigits && !/\d/.test(line1)) {
        const fromLabel = pickStreetLineFromLabel(hit.label);
        if (fromLabel) line1 = fromLabel;
      }
      setDeliveryCoords(hit.lat, hit.lng);
      setDeliveryLine1(line1);
      setDeliveryCommune(com);
      setUnifiedAddressSearch([line1, com].filter(Boolean).join(", "));
      setDeliveryKmManual("");
      setAddressHitsOpen(false);
      setDeliveryAddressPrecision(hit.precision === "exact" ? "exact" : "approx");
      setGeoHint(
        "Direccion encontrada. Revisa calle, comuna y el costo de envio."
      );
      setShowDeliveryReference(true);
    },
    [
      setDeliveryCoords,
      setDeliveryCommune,
      setDeliveryKmManual,
      setDeliveryLine1,
      setShowDeliveryReference,
      setUnifiedAddressSearch,
      unifiedAddressSearch,
    ]
  );

  const activeInfo = useMemo<ActiveSessionInfo>(() => {
    const info = businessInfo || {};
    if (!selectedBranch) return info;
    return {
      ...info,
      ...selectedBranch,
      name: selectedBranch.name || info.name,
      address: selectedBranch.address || info.address,
      phone: selectedBranch.phone || info.phone,
      bank_name: selectedBranch.bank_name || info.bank_name,
      account_type: selectedBranch.account_type || info.account_type,
      account_number: selectedBranch.account_number || info.account_number,
      account_rut: selectedBranch.account_rut || info.account_rut,
      account_email: selectedBranch.account_email || info.account_email,
      account_holder: selectedBranch.account_holder || info.account_holder,
    };
  }, [businessInfo, selectedBranch]);

  useEffect(() => {
    return () => {
      const receiptPreview = getValues("receiptPreview");
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [getValues]);

  const validation = useMemo(() => {
    const values = formValues; // CORRECTO: Usa los valores reactivos de watch()
    const isPhoneValid = validateChileCustomerPhone(values.phone || "");

    const isRutValid = validateRutChile(values.rut || "");

    const nameValue = (values.name || "").trim();
    const namePattern = /^[\p{L} .'-]+$/u;
    const isNameValid = nameValue.length > 2 && namePattern.test(nameValue);
    const requiresReceipt =
      Boolean(
        paymentMethodKey &&
          PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline &&
          paymentMethodKey !== "transferencia_bancaria"
      );
    const isReceiptValid = requiresReceipt ? !!values.receiptFile : true;

    return {
      rut: isRutValid,
      phone: isPhoneValid,
      name: isNameValid,
      receipt: isReceiptValid,
      isReady: isNameValid && isPhoneValid && isRutValid && isReceiptValid,
    };
  }, [formValues, paymentMethodKey]); // CORRECTO: Depende de los valores reactivos

  // Usar setValue de react-hook-form para cambios
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === "rut") value = formatRutOnInput(value);
    if (field === "phone") value = normalizeChilePhoneInput(value);
    setValue(field as keyof typeof clientSchema.shape, value);
    setViewState((prev) => ({ ...prev, error: null }));
  }, [setValue, clientSchema]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // ...existing code...
      if (file) {
        const preview = URL.createObjectURL(file);
        const { valid, error: validationError } = validateImageFile(file);
        if (!valid) {
          setViewState((prev) => ({
            ...prev,
            error: validationError || "Archivo no valido.",
          }));
          return;
        }
        setValue("receiptFile", file);
        setValue("receiptPreview", preview);
        setViewState((prev) => ({ ...prev, error: null }));
      }
    },
    [setValue]
  );

  const resetFlow = useCallback(() => {
    setViewState({
      showPaymentInfo: false,
      showPaymentMethods: false,
      showForm: false,
      showSuccess: false,
      isSaving: false,
      error: null,
      receiptUploadFailed: false,
      lastOrderSuccess: null,
    });
    setPaymentMethodKey(null);
    setValue("name", "");
    setValue("phone", "+56 9 ");
    setValue("rut", "");
    setValue("receiptFile", null);
    setValue("receiptPreview", undefined);
    setShowFieldErrors(false);
  }, [setValue]);

  const handleCloseCart = useCallback(() => {
    if (viewState.showSuccess) {
      toggleCart();
      return;
    }
    toggleCart();
    setTimeout(resetFlow, 300);
  }, [viewState.showSuccess, toggleCart, resetFlow]);

  const triggerHaptic = useCallback((duration = 8) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(duration);
    }
  }, []);

  const handleFulfillmentChange = useCallback(
    (next: CartFulfillment) => {
      if (fulfillment === next) return;
      const scroller = fulfillmentScrollRef.current;
      const choice = fulfillmentChoiceRef.current;
      const prevScrollTop = scroller?.scrollTop ?? 0;
      const prevChoiceTop = choice?.getBoundingClientRect().top ?? 0;
      setFulfillment(next);
      requestAnimationFrame(() => {
        if (!scroller) return;
        const nextChoiceTop = choice?.getBoundingClientRect().top ?? prevChoiceTop;
        const delta = nextChoiceTop - prevChoiceTop;
        scroller.scrollTop = Math.max(0, prevScrollTop + delta);
      });
    },
    [fulfillment, setFulfillment],
  );

  // Nota: se eliminó el swipe/drag de cierre del carrito.

  const toggleGlobalExtra = useCallback(
    (extra: { id: string; name: string; price: number }) => {
      const current = Array.isArray(globalExtras) ? globalExtras : [];
      const exists = current.some((x) => x.id === extra.id);
      if (exists) {
        setGlobalExtras(current.filter((x) => x.id !== extra.id));
      } else {
        setGlobalExtras([
          ...current,
          { id: extra.id, name: extra.name, price: extra.price, qty: 1 },
        ]);
      }
    },
    [globalExtras, setGlobalExtras],
  );

  const addUpsellBeverage = useCallback(
    (bev: { id: string; name: string; price: number }) => {
      addToCart(
        {
          id: `upsell_beverage_${bev.id}`,
          name: bev.name,
          description: "Bebida sugerida",
          image_url: null,
          price: bev.price,
          has_discount: false,
          discount_price: null,
          is_active: true,
        },
        {
          selectedBeverages: [{ id: bev.id, name: bev.name, price: bev.price, qty: 1 }],
        },
      );
    },
    [addToCart],
  );

  const handleSendOrder = handleSubmit(async (data) => {
    // ...existing code...
    if (!canCheckout) {
      const msg = selectedBranch
        ? `Esta sucursal (${selectedBranch.name}) no esta recibiendo pedidos. Abre la caja en el admin para habilitar compras.`
        : businessInfo?.schedule
          ? `Nuestro horario es: ${businessInfo.schedule}`
          : "No se pueden recibir pedidos en este momento.";
      // ...existing code...
      setViewState((v) => ({ ...v, isSaving: false, error: msg }));
      return;
    }
    if (viewState.isSaving) {
      // ...existing code...
      return;
    }
    if (!selectedBranch?.id) {
      // ...existing code...
      setViewState((prev) => ({
        ...prev,
        error: "No hay sucursal seleccionada. Elige una sucursal para enviar el pedido.",
      }));
      return;
    }
    if (fulfillment === "delivery" && deliverySettings.enabled && !canProceedFulfillment) {
      setViewState((v) => ({
        ...v,
        isSaving: false,
        error: "Completa la direccion de delivery o revisa el monto minimo.",
      }));
      return;
    }
    if (
      paymentMethodKey &&
      fulfillment === "delivery" &&
      deliverySettings.enabled &&
      !isOrderPaymentAllowedForDelivery(paymentMethodKey, deliverySettings)
    ) {
      setViewState((v) => ({
        ...v,
        isSaving: false,
        error:
          "El metodo de pago no esta permitido para delivery en esta sucursal. Elige otro.",
      }));
      return;
    }
    setViewState((v) => ({ ...v, isSaving: true, error: null }));
    try {
      // Usar `filteredCart` (ya tiene precios/activos validados contra la sucursal).
      // Evita errores `invalid_item_price` / productos no disponibles al RPC.
      const itemsForOrder = (filteredCart as CartLineItem[]).map((item) => {
        const selectedExtras = (item.selected_extras ?? [])
          .map((ex) => ({
            id: String(ex.id),
            name: String(ex.name),
            price: Math.max(0, Number(ex.price) || 0),
            qty: Math.max(1, Number(ex.qty) || 1),
          }))
          .filter((ex) => ex.id);
        const selectedBeverages = (
          isUpsellBeverageLineId(item.id) ? [] : (item.selected_beverages ?? [])
        )
          .map((bev) => ({
            id: String(bev.id),
            name: String(bev.name),
            price: Math.max(0, Number(bev.price) || 0),
            qty: Math.max(1, Number(bev.qty) || 1),
          }))
          .filter((bev) => bev.id);
        const extrasTotal = [...selectedExtras, ...selectedBeverages].reduce(
          (sum, x) => sum + x.price * x.qty,
          0,
        );
        const extrasDesc = [
          selectedExtras.length
            ? `Extras: ${selectedExtras.map((x) => `${x.qty}x ${x.name}`).join(", ")}`
            : "",
          selectedBeverages.length
            ? `Bebidas: ${selectedBeverages.map((x) => `${x.qty}x ${x.name}`).join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(" | ");
        const fullDesc = [item.description ?? "", item.line_summary ?? "", extrasDesc]
          .filter(Boolean)
          .join(" | ");
        return {
          id: item.id,
          name: String(item.name ?? ""),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          has_discount: Boolean(item.has_discount),
          discount_price: item.has_discount && item.discount_price != null ? Number(item.discount_price) : null,
          description: fullDesc ? sanitizeUserText(fullDesc) : null,
          extras_total: Math.round(extrasTotal),
          extras: [...selectedExtras, ...selectedBeverages],
          custom_item: String(item.id ?? "").startsWith("upsell_beverage_"),
        };
      });
      const globalExtrasLines = (globalExtras ?? []).map((ex, idx) => ({
        id: `global_extra_${idx}_${ex.id}`,
        name: String(ex.name ?? "Extra global"),
        quantity: Math.max(1, Number(ex.qty) || 1),
        price: Math.max(0, Number(ex.price) || 0),
        has_discount: false,
        discount_price: null,
        description: "Extra global del pedido",
        extras_total: 0,
        extras: [],
        custom_item: true,
      }));
      const mergedItemsForOrder = [...itemsForOrder, ...globalExtrasLines];
      const isOnline = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline;
      const snapFulfillment = fulfillment;
      const snapSubtotal = cartSubtotal;
      const snapFee =
        snapFulfillment === "delivery" && deliverySettings.enabled ? deliveryFee : 0;
      const snapGrand = grandTotal;
      const addrFull = `${deliveryLine1}, ${deliveryCommune}`.trim();
      const kmForOrder =
        snapFulfillment === "delivery" &&
        deliverySettings.enabled &&
        deliveryPriceMode === "distance"
          ? quotedRouteKm != null && Number(quotedRouteKm) > 0
            ? Math.round(Number(quotedRouteKm))
            : Math.round(Number(String(deliveryKmManual).replace(",", ".")) || 0)
          : 0;
      const deliverySnapshot =
        snapFulfillment === "delivery" && deliverySettings.enabled
          ? {
              address: sanitizeUserText(addrFull),
              formatted_address: sanitizeUserText(addrFull),
              line1: sanitizeUserText(deliveryLine1),
              commune: sanitizeUserText(deliveryCommune),
              ...(deliveryReference.trim()
                ? { reference: sanitizeUserText(deliveryReference) }
                : {}),
              lat: deliveryLat,
              lng: deliveryLng,
              ...(deliveryNamedAreaId?.trim()
                ? { named_area_id: deliveryNamedAreaId.trim() }
                : {}),
              ...(deliveryNamedAreaLabel
                ? { named_area_label: deliveryNamedAreaLabel }
                : {}),
            }
          : null;
      const orderPayload = {
        client_name: sanitizeUserText(data.name),
        client_phone: String(data.phone ?? "").trim(),
        client_rut: String(data.rut ?? "").trim(),
        payment_type: isOnline ? ('online' as const) : ('tienda' as const),
        payment_method_specific: paymentMethodKey,
        total: Number(snapGrand) || 0,
        items: mergedItemsForOrder,
        note: sanitizeUserText(orderNote),
        status: "pending",
        receiptFile: data.receiptFile,
        branch_id: selectedBranch.id,
        branch_name: selectedBranch.name || "Desconocido",
        company_id: selectedBranch.company_id || null,
        order_type:
          snapFulfillment === "delivery" && deliverySettings.enabled
            ? ("delivery" as const)
            : ("pickup" as const),
        delivery_address: deliverySnapshot,
        delivery_fee: snapFee,
        delivery_km: kmForOrder,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        delivery_named_area_id: deliveryNamedAreaId?.trim() || null,
      };
      const { order: newOrder, receiptUploadFailed } = await ordersService.createOrder(
        orderPayload,
        data.receiptFile ?? null
      );
      const parsed = parseOrderRpcPayload(newOrder);
      setViewState((v) => ({
        ...v,
        showSuccess: true,
        isSaving: false,
        receiptUploadFailed: receiptUploadFailed ?? false,
        lastOrderSuccess: parsed
          ? { ...parsed, fulfillment: snapFulfillment }
          : {
              id: 0,
              order_number: null,
              handoff_code: null,
              fulfillment: snapFulfillment,
            },
      }));
      setShowFieldErrors(false);
      const deliverySummary =
        snapFulfillment === "delivery" && deliverySnapshot
          ? `Direccion: ${deliverySnapshot.line1}, ${deliverySnapshot.commune}`
          : undefined;
      setTimeout(() => {
        const paymentData = paymentMethodKey
          ? (activeInfo as Record<string, unknown>)[paymentMethodKey]
          : undefined;
        const message = generateWSMessage(
          data,
          cart,
          snapGrand,
          paymentMethodKey,
          orderNote,
          activeInfo.name,
          paymentData,
          {
            fulfillment: snapFulfillment,
            cartSubtotal: snapSubtotal,
            deliveryFee: snapFee,
            grandTotal: snapGrand,
            deliverySummary,
            orderId: parsed?.id ?? null,
            orderNumber: parsed?.order_number ?? null,
            handoffCode: parsed?.handoff_code ?? null,
          }
        );
        let targetPhone = "56976645547";
        if (activeInfo.phone) {
          targetPhone = activeInfo.phone.replace(/\D/g, "");
        }
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
        clearCart();
      }, 1500);
    } catch (error: unknown) {
      const errorRecord = (error ?? {}) as Record<string, unknown>;
      const message = String(errorRecord.message || "Error al procesar el pedido. Intenta nuevamente.");
      setViewState((v) => ({ ...v, isSaving: false, error: message }));
    }
  });

  const enhanceTabCount =
    (beveragesUpsellEnabledByBranch ? 1 : 0) + (extrasEnabledByBranch ? 1 : 0);

  if (!isCartOpen) return null;

  if (viewState.showSuccess) {
    return (
      <div className="modal-overlay cart-overlay" onClick={handleCloseCart}>
        <div
          className="cart-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="cart-header">
            <h3>¡Pedido Enviado!</h3>
            <button onClick={handleCloseCart} className="btn-close-cart" aria-label="Cerrar"><X size={20} /></button>
          </header>
          <SuccessView
            onNewOrder={resetFlow}
            onGoHome={handleCloseCart}
            receiptUploadFailed={viewState.receiptUploadFailed}
            activeInfo={activeInfo}
            lastOrder={viewState.lastOrderSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay cart-overlay" onClick={handleCloseCart}>
      <div
        className="cart-panel"
        data-checkout-phase={checkoutPhase}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cart-header">
          <div className="cart-header-main">
            <div className="cart-header-title-row">
              <h3>Tu Pedido</h3>
              <span className="cart-count-badge">{filteredCart.length}</span>
            </div>
            {selectedBranch ? (
              <div className="cart-branch-row">
                <MapPin size={13} className="cart-branch-icon" aria-hidden />
                <span className="cart-branch-name">{selectedBranch.name}</span>
              </div>
            ) : null}
          </div>
          <button onClick={handleCloseCart} className="btn-close-cart" aria-label="Cerrar"><X size={20} /></button>
        </header>

        {viewState.error ? (
          <div className="cart-error-banner animate-fade">
            <AlertCircle size={16} /> {viewState.error}
          </div>
        ) : null}

        <div
          className={`cart-body cart-checkout-phase--${checkoutPhase}${
            isDeliveryFulfillmentFocus ? " cart-body--delivery-step" : ""
          }`}
        >
          {cart.length === 0 ? (
            <EmptyState onMenu={handleCloseCart} />
          ) : (
            <>
              {!isDeliveryFulfillmentFocus ? (
                <>
              <div className="cart-items-list">
                {(filteredCart as CartLineItem[]).map((item) => (
                  <CartItem
                    key={item.lineId ?? item.id}
                    item={item}
                    unitPrice={getPrice(item)}
                    onRemove={removeFromCart}
                    onAdd={addToCart}
                    onDecrease={decreaseQuantity}
                  />
                ))}
              </div>
              <div className="cart-notes">
                <label>Notas de cocina</label>
                <textarea
                  className="form-input"
                  placeholder="Ej: Sin sésamo..."
                  value={orderNote}
                  onChange={(event) => setOrderNote(event.target.value)}
                  rows={2}
                />
              </div>
                </>
              ) : null}
            </>
          )}
        </div>

        {cart.length > 0 ? (
          <>
            {!viewState.showPaymentInfo &&
            !viewState.showPaymentMethods &&
            !viewState.showForm &&
            (beveragesUpsellEnabledByBranch || extrasEnabledByBranch) ? (
              <div className="cart-footer-enhance-container">
                <div
                  className={`cart-footer-enhance-rail${
                    enhanceTabCount === 1 ? " cart-footer-enhance-rail--single" : ""
                  }`}
                >
                <div
                  className={`cart-footer-enhance-expand${
                    activeEnhancePanel !== "none" ? " is-open" : ""
                  }`}
                  aria-hidden={activeEnhancePanel === "none"}
                >
                  <div className="cart-footer-enhance-scroll">
                    <div className="cart-enhance-panel glass cart-enhance-panel--in-footer">
                      {activeEnhancePanel === "beverages" ? (
                        <div className="cart-enhance-grid cart-enhance-grid--tiles">
                          {enhancementCatalogs.beverages.map((bev) => (
                            <div
                              key={bev.id}
                              className="cart-enhance-tile cart-enhance-tile--drink"
                            >
                              <button
                                type="button"
                                className="cart-enhance-tile-body"
                                onClick={() => addUpsellBeverage(bev)}
                              >
                                <CartEnhanceCatalogGlyph
                                  key={`${bev.id}-${bev.image_url ?? ""}`}
                                  imageUrl={bev.image_url}
                                  fallbackSrc={ENHANCE_CATALOG_BEVERAGE_FALLBACK}
                                />
                                <span className="cart-enhance-tile-main">
                                  <span className="cart-enhance-tile-title">{bev.name}</span>
                                  <span className="cart-enhance-tile-sub">
                                    ${formatCartMoney(bev.price)}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                className="cart-enhance-tile-plus"
                                onClick={() => addUpsellBeverage(bev)}
                                aria-label={`Agregar ${bev.name}`}
                              >
                                <Plus size={18} strokeWidth={2.5} aria-hidden />
                              </button>
                            </div>
                          ))}
                          {enhancementCatalogs.beverages.length === 0 ? (
                            <p className="cart-geo-hint">No hay bebidas configuradas para upsell.</p>
                          ) : null}
                        </div>
                      ) : activeEnhancePanel === "extras" ? (
                        <div className="cart-enhance-grid cart-enhance-grid--tiles">
                          {enhancementCatalogs.globalExtras.map((extra) => {
                            const active = (globalExtras ?? []).some((x) => x.id === extra.id);
                            return (
                              <div
                                key={extra.id}
                                className={`cart-enhance-tile cart-enhance-tile--extra${
                                  active ? " is-selected" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  className="cart-enhance-tile-body"
                                  onClick={() => toggleGlobalExtra(extra)}
                                >
                                  <CartEnhanceCatalogGlyph
                                    key={`${extra.id}-${extra.image_url ?? ""}`}
                                    imageUrl={extra.image_url}
                                    fallbackSrc={ENHANCE_CATALOG_EXTRA_FALLBACK}
                                  />
                                  <span className="cart-enhance-tile-main">
                                    <span className="cart-enhance-tile-title">{extra.name}</span>
                                    <span className="cart-enhance-tile-sub">
                                      {active ? (
                                        <span className="cart-enhance-tile-pill">En tu pedido</span>
                                      ) : (
                                        `$${formatCartMoney(extra.price)}`
                                      )}
                                    </span>
                                  </span>
                                </button>
                                {active ? (
                                  <span className="cart-enhance-tile-check" aria-hidden>
                                    <Check size={18} strokeWidth={2.5} />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="cart-enhance-tile-plus"
                                    onClick={() => toggleGlobalExtra(extra)}
                                    aria-label={`Agregar ${extra.name}`}
                                  >
                                    <Plus size={18} strokeWidth={2.5} aria-hidden />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {enhancementCatalogs.globalExtras.length === 0 ? (
                            <p className="cart-geo-hint">No hay extras globales configurados.</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="cart-enhance-segmented-wrap">
                  <div
                    className={`cart-enhance-segmented${
                      enhanceTabCount === 1 ? " cart-enhance-segmented--single" : ""
                    }`}
                    role="tablist"
                    aria-label={
                      beveragesUpsellEnabledByBranch && extrasEnabledByBranch
                        ? "Agregar bebidas o extras al pedido"
                        : beveragesUpsellEnabledByBranch
                          ? "Bebidas para tu pedido"
                          : "Extras globales del pedido"
                    }
                  >
                    {beveragesUpsellEnabledByBranch ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeEnhancePanel === "beverages"}
                        className={`cart-enhance-seg ${
                          activeEnhancePanel === "beverages" ? "is-active" : ""
                        }`}
                        onClick={() => {
                          triggerHaptic();
                          setActiveEnhancePanel((v) => (v === "beverages" ? "none" : "beverages"));
                        }}
                      >
                        <CupSoda size={17} aria-hidden />
                        <span>Bebidas</span>
                      </button>
                    ) : null}
                    {extrasEnabledByBranch ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeEnhancePanel === "extras"}
                        className={`cart-enhance-seg ${
                          activeEnhancePanel === "extras" ? "is-active" : ""
                        }`}
                        onClick={() => {
                          triggerHaptic();
                          setActiveEnhancePanel((v) => (v === "extras" ? "none" : "extras"));
                        }}
                      >
                        <Sparkles size={17} aria-hidden />
                        <span>Extras</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                </div>
              </div>
            ) : null}
            <div className="cart-footer-stack cart-footer-stack--solo">
            <footer
              className={`cart-footer cart-footer--sheet${
                viewState.showPaymentInfo && !viewState.showPaymentMethods
                  ? " cart-footer--checkout-fulfillment"
                  : ""
              }`}
            >
            <div
              key={viewState.showPaymentInfo ? "checkout" : "summary"}
              className="cart-footer-pane"
            >
            {!viewState.showPaymentInfo ? (
              <>
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${formatCartMoney(cartSubtotal)}</span>
                </div>
                {fulfillment === "delivery" && deliverySettings.enabled ? (
                  <div className="total-row total-row-delivery">
                    <span>Envio</span>
                    <span>
                      {deliveryWaivedFree
                        ? "Gratis"
                        : isDeliveryOutOfZone
                          ? "—"
                          : `$${formatCartMoney(deliveryFee)}`}
                    </span>
                  </div>
                ) : null}
                <div className="total-row total-row-grand">
                  <span>Total</span>
                  <span className="total-price">${formatCartMoney(grandTotal)}</span>
                </div>

                {isShiftLoading ? (
                  <button className="btn btn-primary btn-block btn-lg" disabled>
                    Cargando...
                  </button>
                ) : !canCheckout ? (
                  <div className="cash-closed-banner">
                    <AlertCircle size={16} />
                    <span>
                      {selectedBranch
                        ? `Esta sucursal no está recibiendo pedidos. Abre la caja en ${selectedBranch.name} para habilitar compras.`
                        : `Caja cerrada.${businessInfo?.schedule ? ` Horario: ${businessInfo.schedule}` : ""}`}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setActiveEnhancePanel("none");
                      setViewState((v) => ({
                        ...v,
                        showPaymentInfo: true,
                        showPaymentMethods: false,
                      }));
                    }}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    Ir a Pagar
                  </button>
                )}
              </>
            ) : !viewState.showPaymentMethods ? (
              <>
                <div className="cart-footer-fulfillment-expand">
                  <div className="cart-footer-fulfillment-scroll" ref={fulfillmentScrollRef}>
                    {deliverySettings.enabled ? (
                      <div
                        className={`cart-fulfillment-block cart-fulfillment-block--in-footer ${
                          isDeliveryFulfillmentFocus
                            ? "cart-fulfillment-block--focus"
                            : "glass"
                        } ${fulfillment === "delivery" ? "cart-fulfillment-block--delivery-open" : ""}`}
                      >
                      <div className="cart-fulfillment-title">Como quieres recibir tu pedido</div>
                      <p className="cart-fulfillment-subtitle">
                        Elige una opcion para continuar con el checkout.
                      </p>
                      <div className="cart-fulfillment-choice" ref={fulfillmentChoiceRef}>
                        <button
                          type="button"
                          className={`cart-fulfill-option ${fulfillment === "pickup" ? "is-active" : ""}`}
                          onClick={() => handleFulfillmentChange("pickup")}
                        >
                          <Store size={18} />
                          Retiro
                        </button>
                        <button
                          type="button"
                          className={`cart-fulfill-option ${fulfillment === "delivery" ? "is-active" : ""}`}
                          onClick={() => handleFulfillmentChange("delivery")}
                        >
                          <Truck size={18} />
                          Delivery
                        </button>
                      </div>
                      {fulfillment === "delivery" && deliverySettings.enabled ? (
                        <div className="cart-delivery-fields">
                          {deliverySettings.customerNotes ? (
                            <p className="cart-delivery-note">{deliverySettings.customerNotes}</p>
                          ) : null}

                          {deliveryPriceMode === "named" &&
                          deliverySettings.namedAreaResolution === "manual_select" ? (
                            <>
                              <label className="cart-field-label" id="cart-named-area-label">
                                Zona de entrega
                              </label>
                              <CartNamedAreaSelect
                                areas={deliverySettings.namedAreas}
                                value={deliveryNamedAreaId}
                                formatMoney={formatCartMoney}
                                onPick={(id) => {
                                  setDeliveryNamedAreaId(id);
                                  if (id) {
                                    const area = deliverySettings.namedAreas.find((a) => a.id === id);
                                    if (area?.name) setDeliveryCommune(area.name);
                                  }
                                }}
                              />
                            </>
                          ) : null}

                          {deliveryPriceMode === "named" &&
                          deliverySettings.namedAreaResolution === "address_matched" ? (
                            <p className="cart-delivery-note">
                              Escribi calle, número y comuna; calculamos la tarifa según las zonas del local.
                            </p>
                          ) : null}

                          {deliveryPriceMode === "distance" ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-block cart-geo-btn"
                                onClick={requestDeliveryGeo}
                              >
                                <MapPin size={17} aria-hidden />
                                <span className="cart-geo-btn-copy">Usar ubicación actual</span>
                              </button>
                              <p className="cart-geo-helper">
                                Calculamos el envío con mayor precisión.
                              </p>
                              {geoHint ? <p className="cart-geo-hint">{geoHint}</p> : null}
                              <p className="cart-delivery-note">
                                Escribí tu dirección completa (calle y número y, si puedes,
                                la comuna). Con eso te cotizamos el envío y coordinamos
                                el pedido por WhatsApp.
                              </p>
                              {deliveryAddressPrecision === "approx" ? (
                                <p className="cart-fulfillment-warn">
                                  Esta sugerencia es solo zona o ciudad: el mapa puede quedar lejos de
                                  tu puerta. Preferí otra opción con dirección más específica, ajustá
                                  calle o comuna, o usá <strong>Usar mi ubicación</strong>.
                                </p>
                              ) : null}
                            </>
                          ) : null}

                          <div
                            className={
                              deliveryPriceMode === "distance"
                                ? "cart-address-search-wrap"
                                : undefined
                            }
                            ref={
                              deliveryPriceMode === "distance"
                                ? addressSearchWrapRef
                                : undefined
                            }
                          >
                            {deliveryPriceMode === "distance" ? (
                              <>
                              <label
                                className="cart-field-label"
                                htmlFor="cart-delivery-commune"
                              >
                                Comuna o ciudad
                              </label>
                              <input
                                id="cart-delivery-commune"
                                className="form-input"
                                value={deliveryCommune}
                                onChange={(e) => {
                                  const nextCommune = e.target.value;
                                  setDeliveryCommune(nextCommune);
                                  setDeliveryAddressPrecision(null);
                                  const streetPart = [
                                    streetInput.trim(),
                                    streetNumberInput.trim(),
                                  ]
                                    .filter(Boolean)
                                    .join(" ");
                                  const merged = [
                                    streetPart,
                                    nextCommune.trim(),
                                  ]
                                    .filter(Boolean)
                                    .join(", ");
                                  setUnifiedAddressSearch(merged);
                                }}
                                placeholder="Ej: Ñuñoa"
                              />

                              <label
                                className="cart-field-label"
                                htmlFor="cart-delivery-street"
                              >
                                Calle
                              </label>
                              <input
                                id="cart-delivery-street"
                                className="form-input"
                                value={streetInput}
                                onChange={(e) => {
                                  const nextStreet = e.target.value;
                                  setStreetInput(nextStreet);
                                  setDeliveryAddressPrecision(null);
                                  const streetPart = [
                                    nextStreet.trim(),
                                    streetNumberInput.trim(),
                                  ]
                                    .filter(Boolean)
                                    .join(" ");
                                  setDeliveryLine1(streetPart);
                                  const merged = [streetPart, deliveryCommune.trim()]
                                    .filter(Boolean)
                                    .join(", ");
                                  setUnifiedAddressSearch(merged);
                                }}
                                placeholder="Ej: Avenida Vicuña Mackenna"
                              />

                              <label
                                className="cart-field-label"
                                htmlFor="cart-delivery-number"
                              >
                                Número
                              </label>
                              <input
                                id="cart-delivery-number"
                                className="form-input"
                                value={streetNumberInput}
                                onChange={(e) => {
                                  const nextNumber = e.target.value;
                                  setStreetNumberInput(nextNumber);
                                  setDeliveryAddressPrecision(null);
                                  const streetPart = [
                                    streetInput.trim(),
                                    nextNumber.trim(),
                                  ]
                                    .filter(Boolean)
                                    .join(" ");
                                  setDeliveryLine1(streetPart);
                                  const merged = [streetPart, deliveryCommune.trim()]
                                    .filter(Boolean)
                                    .join(", ");
                                  setUnifiedAddressSearch(merged);
                                }}
                                inputMode="numeric"
                                placeholder="Ej: 1432"
                              />
                              </>
                            ) : null}
                        {SHOW_ADDRESS_SUGGESTIONS &&
                        deliveryPriceMode === "distance" &&
                            addressSearchLoading ? (
                              <p className="cart-geo-hint">Buscando direcciones…</p>
                            ) : null}
                        {SHOW_ADDRESS_SUGGESTIONS &&
                        deliveryPriceMode === "distance" &&
                            addressSearchConfigError ? (
                              <p className="cart-fulfillment-warn">
                                {addressSearchConfigError}
                              </p>
                            ) : null}
                        {SHOW_ADDRESS_SUGGESTIONS &&
                        deliveryPriceMode === "distance" &&
                            addressHitsOpen &&
                            addressHits.length > 0 ? (
                              <ul
                                className="cart-address-hits"
                                aria-label="Sugerencias de dirección"
                              >
                                {addressHits.map((hit, idx) => {
                                  const subtitle = hit.commune?.trim() || "";
                                  return (
                                    <li key={`${hit.lat}-${hit.lng}-${idx}`}>
                                      <button
                                        type="button"
                                        className="cart-address-hit-btn"
                                        onClick={() => selectAddressSearchHit(hit)}
                                      >
                                        <MapPin
                                          className="cart-address-hit-pin"
                                          size={18}
                                          aria-hidden
                                        />
                                        <span className="cart-address-hit-body">
                                          <span className="cart-address-hit-primary">
                                            {hit.line1 || hit.label}
                                          </span>
                                          {subtitle ? (
                                            <span className="cart-address-hit-detail">
                                              {subtitle}
                                            </span>
                                          ) : null}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </div>
                          {fulfillment === "delivery" &&
                          deliveryPriceMode === "distance" &&
                          lineGeocodeLoading ? (
                            <p className="cart-geo-hint">
                              Actualizando ubicación con calle y número (recalculamos envío)…
                            </p>
                          ) : null}

                          {fulfillment === "delivery" &&
                          deliveryPriceMode === "distance" ? (
                            <DeliveryPreviewMap lat={deliveryLat} lng={deliveryLng} />
                          ) : null}

                          <label className="cart-field-label">
                            Indicaciones para el repartidor (obligatorio)
                          </label>
                          <textarea
                            className="form-input"
                            rows={2}
                            value={deliveryReference}
                            onChange={(e) => setDeliveryReference(e.target.value)}
                            placeholder="Depto, timbre, color de portón, referencias…"
                          />
                          {!deliveryReferenceOk && fulfillment === "delivery" ? (
                            <p className="cart-geo-hint">
                              Minimo {MIN_DRIVER_REFERENCE_LEN} caracteres para que el repartidor te encuentre.
                            </p>
                          ) : null}

                          {deliveryQuoteLoading ? (
                            <p className="cart-geo-hint">Calculando envío…</p>
                          ) : null}
                          {deliveryQuoteError ? (
                            <p className="cart-fulfillment-warn">{deliveryQuoteError}</p>
                          ) : null}
                          {deliveryNamedAreaLabel ? (
                            <p className="cart-geo-hint">Zona detectada: {deliveryNamedAreaLabel}</p>
                          ) : null}

                          {fulfillment === "delivery" &&
                          deliveryPriceMode === "distance" &&
                          quotedRouteKm != null &&
                          quotedRouteKm > 0 ? (
                            <div className="cart-delivery-quote">
                              <span>Distancia aprox. (línea recta)</span>
                              <strong>{Math.round(Number(quotedRouteKm))} km</strong>
                            </div>
                          ) : null}
                          <div className="cart-delivery-quote cart-delivery-fee-row">
                            <span>Costo de envío</span>
                            <strong>
                              {deliveryWaivedFree
                                ? "Gratis"
                                : isDeliveryOutOfZone
                                  ? "Fuera de zona"
                                  : `$${formatCartMoney(deliveryFee)}`}
                            </strong>
                          </div>
                          {!meetsMinDelivery ? (
                            <p className="cart-fulfillment-warn">
                              El mínimo para delivery es ${formatCartMoney(minOrder)}.
                            </p>
                          ) : null}
                          {isDeliveryOutOfZone ? (
                            <p className="cart-fulfillment-warn">
                              Tu ubicación supera el máximo de kilómetros de este local.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    ) : (
                      <p className="cart-pickup-only-hint cart-pickup-only-hint--in-footer">
                        Esta sucursal solo acepta retiro en el local.
                      </p>
                    )}
                  </div>
                </div>

                {!canProceedFulfillment ? (
                  <div className="cash-closed-banner">
                    <AlertCircle size={16} />
                    <span>
                      {fulfillment === "delivery" && !deliveryReferenceOk
                        ? `Agrega indicaciones para el repartidor (minimo ${MIN_DRIVER_REFERENCE_LEN} caracteres).`
                        : isDeliveryOutOfZone
                          ? "Tu ubicacion esta fuera del area de delivery de este local."
                          : !meetsMinDelivery
                            ? `Monto minimo para delivery: $${formatCartMoney(minOrder)}.`
                            : deliveryQuoteLoading &&
                                deliveryPriceMode === "distance" &&
                                isValidCoordsForQuote()
                              ? "Calculando envio con tu ubicacion…"
                              : deliveryQuoteError
                                ? deliveryQuoteError
                                : "Completa los datos de envio para continuar."}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      triggerHaptic(12);
                      setViewState((v) => ({ ...v, showPaymentMethods: true }));
                    }}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    Continuar a métodos de pago
                  </button>
                )}
                <button
                  onClick={() =>
                    setViewState((v) => ({
                      ...v,
                      showPaymentInfo: false,
                      showPaymentMethods: false,
                    }))
                  }
                  className="btn btn-text btn-block mt-2"
                >
                  <ArrowLeft size={16} className="mr-5" />
                  Volver al resumen
                </button>
              </>
            ) : (
              <PaymentFlow
                paymentMethodKey={paymentMethodKey}
                setPaymentMethodKey={setPaymentMethodKey}
                paymentMethodsForCheckout={checkoutPaymentMethods}
                showForm={viewState.showForm}
                setShowForm={(value: boolean) => setViewState((v) => ({ ...v, showForm: value }))}
                formData={{
                      name: formValues.name || "",
                      phone: formValues.phone || "",
                      rut: formValues.rut || "",
                      receiptFile: formValues.receiptFile ?? null,
                      receiptPreview: formValues.receiptPreview ?? null,
                }}
                onInputChange={handleInputChange}
                onFileChange={handleFileChange}
                onSubmit={handleSendOrder}
                isSaving={viewState.isSaving}
                validation={validation}
                showFieldErrors={showFieldErrors}
                setShowFieldErrors={setShowFieldErrors}
                cartTotal={grandTotal}
                onBack={() =>
                  setViewState((v) => ({
                    ...v,
                    showPaymentMethods: false,
                    showForm: false,
                  }))
                }
                activeInfo={activeInfo}
                setViewState={setViewState}
                viewState={viewState}
              />
            )}
            </div>
          </footer>
          </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const PaymentFlow = ({
  paymentMethodKey,
  setPaymentMethodKey,
  paymentMethodsForCheckout,
  showForm,
  setShowForm,
  formData,
  onInputChange,
  onFileChange,
  onSubmit,
  isSaving,
  validation,
  showFieldErrors,
  setShowFieldErrors,
  cartTotal,
  onBack,
  activeInfo,
  setViewState,
  // viewState solo usado como tipo
}: {
  paymentMethodKey: string | null;
  setPaymentMethodKey: (value: string | null) => void;
  paymentMethodsForCheckout: string[];
  showForm: boolean;
  setShowForm: (value: boolean) => void;
  formData: {
    name: string;
    phone: string;
    rut: string;
    receiptFile: File | null;
    receiptPreview: string | null;
  };
  onInputChange: (field: string, value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSaving: boolean;
  validation: { rut: boolean; phone: boolean; name: boolean; receipt: boolean; isReady: boolean };
  showFieldErrors: boolean;
  setShowFieldErrors: (value: boolean) => void;
  cartTotal: number;
  onBack: () => void;
  activeInfo: ActiveSessionInfo;
  setViewState: React.Dispatch<React.SetStateAction<CartModalViewState>>;
  viewState: CartModalViewState;
}) => {
  const isOnline = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline;
  const requiresReceipt = Boolean(
    paymentMethodKey &&
      PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline &&
      paymentMethodKey !== "transferencia_bancaria"
  );
  const showNameError = showFieldErrors && !validation.name;
  const showRutError = showFieldErrors && !validation.rut;
  const showPhoneError = showFieldErrors && !validation.phone;
  const showReceiptError = showFieldErrors && requiresReceipt && !validation.receipt;
  const topValidationMessage = showFieldErrors
    ? [
        showNameError ? "nombre válido" : null,
        showRutError ? "RUT válido" : null,
        showPhoneError ? "teléfono completo (+56 9)" : null,
        showReceiptError ? "comprobante de transferencia" : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  if (paymentMethodKey && showForm) {
    return (
      <div className="payment-flow">
        <form
          key={`form-${paymentMethodKey}`}
          onSubmit={onSubmit}
          className="checkout-form payment-flow-surface payment-flow-surface--form"
        >
        <h4 className="form-title">
          <MessageCircle size={18} /> Datos del Cliente
        </h4>
        {topValidationMessage ? (
          <div className="checkout-validation-banner">
            Revisa los siguientes campos: {topValidationMessage}.
          </div>
        ) : null}

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(event) => onInputChange("name", event.target.value)}
            className={`form-input ${showNameError ? "input-error" : ""}`}
            placeholder="Tu nombre"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>RUT {validation.rut ? <CheckCircle2 size={14} color="#25d366" /> : null}</label>
            <input
              type="text"
              required
              value={formData.rut}
              onChange={(event) => onInputChange("rut", event.target.value)}
              className={`form-input ${showRutError ? "input-error" : ""}`}
              placeholder="12.345.678-9"
            />
          </div>

          <div className="form-group">
            <label>
              Teléfono {validation.phone ? <CheckCircle2 size={14} color="#25d366" /> : null}
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(event) => onInputChange("phone", event.target.value)}
              className={`form-input ${showPhoneError ? "input-error" : ""}`}
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>

        {requiresReceipt ? (
          <div className="form-group">
            <label>
              Comprobante {validation.receipt ? <CheckCircle2 size={14} color="#25d366" /> : <span className="text-accent">*</span>}
            </label>
            <div
              className="upload-box"
              onClick={() => document.getElementById("receipt-upload")?.click()}
              data-has-preview={formData.receiptPreview ? "true" : "false"}
            >
              <input type="file" id="receipt-upload" accept="image/*" hidden onChange={onFileChange} aria-label="Subir comprobante" title="Subir comprobante" />
              {formData.receiptPreview ? (
                <div className="file-preview-row">
                  <Image src={formData.receiptPreview} alt="Comprobante" width={40} height={40} unoptimized />
                  <span>Imagen cargada</span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={20} /> <span>Subir captura</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="form-actions-col mt-20">
          <button
            type="submit"
            disabled={isSaving || !validation.isReady}
            className="btn btn-primary btn-block"
            onClick={() => {
              if (!validation.isReady) {
                setShowFieldErrors(true);
                let errorMsg = "Por favor completa correctamente:";
                const errors = [];
                if (!validation.name) errors.push("nombre");
                if (!validation.rut) errors.push("RUT");
                if (!validation.phone) errors.push("teléfono");
                if (!validation.receipt && requiresReceipt) errors.push("comprobante");
                if (errors.length > 0) errorMsg += " " + errors.join(", ");
                setViewState((prev) => ({ ...prev, error: errorMsg }));
              }
            }}
          >
            {isSaving ? "Enviando..." : "Confirmar Pedido"}
          </button>
          <button type="button" className="btn btn-text btn-block" onClick={() => setShowForm(false)}>
            <ArrowLeft size={16} className="mr-5" /> Volver atras
          </button>
        </div>
      </form>
      </div>
    );
  }

  if (paymentMethodKey) {
    return (
      <div className="payment-flow">
        <div
          key={`detail-${paymentMethodKey}`}
          className="payment-details payment-flow-surface payment-flow-surface--detail"
        >
        {isOnline ? (
          <OnlinePaymentDetails methodKey={paymentMethodKey} cartTotal={cartTotal} activeInfo={activeInfo} />
        ) : (
          <div key={paymentMethodKey} className="store-pay-info glass mb-20 payment-method-store-card">
            <Store size={32} className="text-accent" />
            <div>
              <h4>{PAYMENT_METHOD_CONFIG[paymentMethodKey]?.label || "Pagar en Local"}</h4>
              <p className="text-muted">Pagas en efectivo o tarjeta al retirar.</p>
            </div>
            <div className="pay-total">Total: ${formatCartMoney(cartTotal)}</div>
          </div>
        )}

        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-block mt-4">
          {isOnline ? "Ya pagué" : "Continuar"}
        </button>

        <button onClick={() => setPaymentMethodKey(null)} className="btn btn-text btn-block mt-2">
          <ArrowLeft size={16} className="mr-5" /> Elegir otro metodo
        </button>
      </div>
      </div>
    );
  }

  const activeMethods = paymentMethodsForCheckout;

  return (
    <div className="payment-flow">
      <div key="pick" className="payment-options payment-flow-surface payment-flow-surface--pick">
      <h4 className="text-center mb-15 text-white">Metodo de Pago</h4>
      {activeMethods.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-4">No hay métodos de pago disponibles para esta forma de entrega.</div>
      ) : (
        activeMethods.map((methodKey, idx) => {
          const config = PAYMENT_METHOD_CONFIG[methodKey];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <button 
              key={methodKey} 
              type="button"
              className="btn btn-secondary btn-block payment-opt" 
              style={{ animationDelay: `${Math.min(idx, 10) * 0.045}s` }}
              onClick={() => setPaymentMethodKey(methodKey)}
            >
              {Icon && <Icon size={20} className="mr-5" />} {config.label}
            </button>
          );
        })
      )}
      <button onClick={onBack} className="btn btn-text btn-block mt-2">
        Cancelar
      </button>
    </div>
    </div>
  );
};

const OnlinePaymentDetails = ({ methodKey, cartTotal, activeInfo }: { methodKey: string; cartTotal: number; activeInfo: ActiveSessionInfo }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderRow = (label: string, value: string | undefined | null) => {
    if (!value) return null;
    return (
      <li className="copy-row" onClick={() => copyToClipboard(value)}>
        <span className="copy-row-label">{label}:</span> <div className="copy-row-value"><b>{value}</b> <Copy size={14} /></div>
      </li>
    );
  };

  // Renderizado dinámico según el método
  const renderDetails = () => {
    let methodData = activeInfo[methodKey as keyof ActiveSessionInfo];

    // Si viene como string JSON, parsear
    if (typeof methodData === "string") {
      try {
        methodData = JSON.parse(methodData);
      } catch {
        methodData = null;
      }
    }

    if (!methodData || typeof methodData !== "object") {
      return <p className="bank-empty-msg">Sin datos configurados para {PAYMENT_METHOD_CONFIG[methodKey]?.label || methodKey}.</p>;
    }

    if (methodKey === 'transferencia_bancaria') {
      const data = methodData as BranchInfo['transferencia_bancaria'] | null | undefined;
      if (!data) return <p className="bank-empty-msg">Sin datos bancarios configurados.</p>;
      const bankName = data.banco;
      const hasAccount = data.nro_cuenta || data.identificacion;
      if (!bankName && !hasAccount) return <p className="bank-empty-msg">Sin datos bancarios configurados.</p>;
      return (
        <ul className="bank-details-list">
          {bankName && <li><span>Banco:</span> <b>{bankName}</b></li>}
          {data.tipo_cuenta && <li><span>Tipo de cuenta:</span> <b>{data.tipo_cuenta}</b></li>}
          {renderRow("Número de cuenta", data.nro_cuenta)}
          {renderRow("RUT / Cédula", data.identificacion)}
          {data.titular && <li><span>Titular:</span> <b>{data.titular}</b></li>}
          {renderRow("Correo", data.email)}
        </ul>
      );
    }

    if (methodKey === 'pago_movil') {
      const data = methodData as BranchInfo['pago_movil'] | null | undefined;
      if (!data || !data.telefono || !data.banco) return <p className="bank-empty-msg">Sin datos de Pago Móvil.</p>;
      return (
        <ul className="bank-details-list">
          {data.banco && <li><span>Banco:</span> <b>{data.banco}</b></li>}
          {renderRow("Teléfono", data.telefono)}
          {renderRow("Cédula", data.identificacion)}
        </ul>
      );
    }

    if (methodKey === 'zelle') {
      const data = methodData as BranchInfo['zelle'] | null | undefined;
      if (!data || !data.email) return <p className="bank-empty-msg">Sin datos de Zelle.</p>;
      return (
        <ul className="bank-details-list">
          {renderRow("Correo Zelle", data.email)}
          {data.name && <li><span>Titular:</span> <b>{data.name}</b></li>}
        </ul>
      );
    }

    // Fallback genérico para otros métodos (stripe, mercadopago, paypal, etc)
    const CART_CONFIG_LABELS: Record<string, string> = {
      email: "Correo",
      name: "Titular",
      banco: "Banco",
      telefono: "Teléfono",
      identificacion: "RUT / Cédula",
      tipo_cuenta: "Tipo de cuenta",
      nro_cuenta: "Número de cuenta",
      titular: "Titular",
      connected: "Conectado",
    };
    const entries = Object.entries(methodData).filter(([, v]) => v && typeof v === "string");
    if (entries.length > 0) {
      return (
        <ul className="bank-details-list">
          {entries.map(([k, v]) => (
            <li key={k} className="copy-row" onClick={() => copyToClipboard(v as string)}>
              <span className="copy-row-label">{CART_CONFIG_LABELS[k] ?? k.replace(/_/g, " ")}:</span>{" "}
              <div className="copy-row-value"><b>{v as string}</b> <Copy size={14} /></div>
            </li>
          ))}
        </ul>
      );
    }

    return <p className="bank-empty-msg">Sigue las instrucciones para pagar con {PAYMENT_METHOD_CONFIG[methodKey]?.label}.</p>;
  };

  return (
    <div className="bank-info glass payment-method-bank-card" key={methodKey}>
      <h4>Datos de Pago</h4>
      {renderDetails()}
      <div className="pay-total">Total: ${formatCartMoney(cartTotal)}</div>
    </div>
  );
};

const SuccessView = ({
  onNewOrder,
  onGoHome,
  receiptUploadFailed,
  activeInfo,
  lastOrder,
}: {
  onNewOrder: () => void;
  onGoHome: () => void;
  receiptUploadFailed: boolean;
  activeInfo: BusinessInfo;
  lastOrder: {
    id: number;
    order_number: number | null;
    handoff_code: string | null;
    fulfillment: CartFulfillment;
  } | null;
}) => {
  const copyText = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };
  const showDeliveryCodes =
    lastOrder?.fulfillment === "delivery" && Boolean(lastOrder?.handoff_code);
  const orderLabel =
    lastOrder?.order_number != null
      ? `#${lastOrder.order_number}`
      : lastOrder && lastOrder.id > 0
        ? `#${lastOrder.id}`
        : null;

  return (
    <div className="cart-success-view animate-fade">
      <div className="success-icon-circle">
        <Check size={40} />
      </div>
      <h2 className="text-accent">¡Pedido Recibido!</h2>
      <p className="success-description">
        Listo. Te contactaremos por WhatsApp para coordinar tu pago.
      </p>
      {receiptUploadFailed ? (
        <p className="cart-receipt-fallback cart-receipt-fallback-warning">
          No se pudo subir el comprobante. Por favor envialo por WhatsApp cuando abras el chat.
        </p>
      ) : null}
      {showDeliveryCodes ? (
        <>
          <div className="cart-success-codes-banner">
            <p>
              <strong>Guarda estos datos.</strong> Te los pediremos cuando te entreguemos el pedido en tu
              domicilio (mostralo o dictalo al repartidor).
            </p>
          </div>
          <div className="order-summary-card cart-success-codes-card">
            {orderLabel ? (
              <>
                <div className="summary-label">Tu pedido</div>
                <button
                  type="button"
                  className="summary-value summary-copy-row"
                  onClick={() => copyText(orderLabel.replace("#", ""))}
                >
                  <b>{orderLabel}</b> <Copy size={14} />
                </button>
              </>
            ) : null}
            <div className="summary-label">Codigo de entrega</div>
            <button
              type="button"
              className="summary-value summary-mono summary-copy-row"
              onClick={() => copyText(lastOrder?.handoff_code ?? "")}
            >
              <b>{lastOrder?.handoff_code}</b> <Copy size={14} />
            </button>
          </div>
        </>
      ) : (
        <div className="order-summary-card">
          <div className="summary-label">Retiro en</div>
          <div className="summary-value">{activeInfo?.address || "Direccion no disponible"}</div>
          <div className="text-xs text-muted">{activeInfo?.name || "Nombre del local"}</div>
          {orderLabel ? (
            <>
              <div className="summary-label">N° pedido</div>
              <div className="summary-value">{orderLabel}</div>
            </>
          ) : null}
        </div>
      )}
      <div className="success-actions">
        <button className="btn btn-primary btn-block" onClick={onNewOrder}>
          Nuevo Pedido
        </button>
        <button className="btn btn-secondary btn-block" onClick={onGoHome}>
          Volver al Menu
        </button>
      </div>
    </div>
  );
};

function CartEnhanceCatalogGlyph({
  imageUrl,
  fallbackSrc,
}: {
  imageUrl: string | null | undefined;
  fallbackSrc: string;
}) {
  const resolved = useMemo(() => {
    const raw = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
    if (!raw) return null;
    const o = getCloudinaryOptimizedUrl(raw, {
      width: 88,
      height: 88,
      crop: "fill",
      gravity: "auto",
    });
    if (typeof o === "string" && o.trim()) return o.trim();
    return raw;
  }, [imageUrl]);

  const primary = resolved ?? fallbackSrc;
  const [src, setSrc] = useState(primary);

  return (
    <span className="cart-enhance-tile-glyph cart-enhance-tile-glyph--media" aria-hidden>
      <Image
        src={src}
        alt=""
        width={44}
        height={44}
        unoptimized
        className="cart-enhance-tile-img"
        onError={() => setSrc(fallbackSrc)}
      />
    </span>
  );
}

const EmptyState = ({ onMenu }: { onMenu: () => void }) => (
  <div className="empty-state">
    <span className="empty-emoji">🍽️</span>
    <h3>Bandeja Vacia</h3>
    <button onClick={onMenu} className="btn btn-secondary mt-20">
      Ir al Menu
    </button>
  </div>
);

const CartItem = ({
  item,
  unitPrice,
  onRemove,
  onAdd,
  onDecrease,
}: {
  item: CartLineItem;
  unitPrice: number;
  onRemove: (id: string) => void;
  onAdd: (
    item: CartLineItem,
    options?: {
      selectedExtras?: Array<{ id: string; name: string; price: number; qty: number }>;
      selectedBeverages?: Array<{ id: string; name: string; price: number; qty: number }>;
    },
  ) => void;
  onDecrease: (id: string) => void;
}) => {
  const optimizedSrc = getCloudinaryOptimizedUrl(item.image_url ?? null, {
    width: 120,
    height: 120,
    crop: "fill",
    gravity: "auto",
  });
  const imageSrc =
    typeof optimizedSrc === "string" && optimizedSrc.trim().length > 0
      ? optimizedSrc
      : FALLBACK_IMAGE;
  const upsellBevOnly = isUpsellBeverageLineId(item.id);
  const extrasText = (item.selected_extras ?? [])
    .map((ex) => `${ex.qty}x ${ex.name}`)
    .join(", ");
  const beveragesText = upsellBevOnly
    ? ""
    : (item.selected_beverages ?? [])
        .map((bev) => `${bev.qty}x ${bev.name}`)
        .join(", ");
  const extrasTotal = (item.selected_extras ?? []).reduce(
    (sum, ex) => sum + (Number(ex.price) || 0) * (Number(ex.qty) || 1),
    0,
  );
  const beveragesTotal = upsellBevOnly
    ? 0
    : (item.selected_beverages ?? []).reduce(
        (sum, bev) => sum + (Number(bev.price) || 0) * (Number(bev.qty) || 1),
        0,
      );
  const lineUnitTotal = Math.max(0, unitPrice + extrasTotal + beveragesTotal);

  return (
    <div className="cart-item">
      {upsellBevOnly ? (
        <div className="item-thumb item-thumb--upsell-drink" aria-hidden>
          <CupSoda size={24} strokeWidth={2} />
        </div>
      ) : (
        <Image
          src={imageSrc}
          alt={item.name ?? "Producto"}
          width={65}
          height={65}
          unoptimized
          className="item-thumb"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      )}
    <div className="item-details item-details-tight">
      <div className="item-top">
        <h4 className="item-title">{item.name}</h4>
        <button
          onClick={() => onRemove(item.lineId ?? item.id)}
          className="btn-trash"
          aria-label="Quitar producto"
          title="Quitar producto"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="item-bottom item-bottom-tight">
        <span className="item-price item-price-strong">
          ${formatCartMoney(lineUnitTotal * item.quantity)}
        </span>
        <div className="qty-control-sm">
          <button
            onClick={() => onDecrease(item.lineId ?? item.id)}
            aria-label="Disminuir cantidad"
            title="Disminuir cantidad"
          >
            <Minus size={12} />
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={() =>
              onAdd(item, {
                selectedExtras: item.selected_extras ?? [],
                selectedBeverages: item.selected_beverages ?? [],
              })
            }
            aria-label="Aumentar cantidad"
            title="Aumentar cantidad"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      {extrasText ? <p className="cart-geo-hint">Extras: {extrasText}</p> : null}
      {beveragesText ? <p className="cart-geo-hint">Bebidas: {beveragesText}</p> : null}
      {item.line_summary ? <p className="cart-geo-hint">{item.line_summary}</p> : null}
    </div>
  </div>
  );
};
