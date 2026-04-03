import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { uploadImage } from "./utils/cloudinary";
import {
	computeDeliveryFee,
	effectiveDeliveryPricingMode,
	normalizeDeliverySettings,
} from "../../lib/delivery-settings";
import type { Json } from "../../types/supabase-database";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  has_discount?: boolean;
  discount_price?: number | null;
  description?: string | null;
  extras_total?: number;
  extras?: Array<{ id: string; name: string; price: number; qty: number }>;
  custom_item?: boolean;
}

interface CreateOrderPayload {
  client_name: string;
  client_phone: string;
  client_rut?: string;
  payment_type: "online" | "tienda" | null;
  payment_method_specific?: string | null;
  total: number;
  items: OrderItem[];
  note?: string | null;
  status?: string;
  receiptFile?: File | null;
  branch_id: string;
  branch_name?: string | null;
  company_id?: string | null;
  payment_ref?: string | null;
  order_type?: "pickup" | "delivery";
  delivery_address?: Record<string, unknown> | null;
  delivery_fee?: number;
  /** Km declarados (distancia) o último km cotizado en cliente. */
  delivery_km?: number;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_named_area_id?: string | null;
  namedAreaId?: string | null;
  /** Cotización Uber Direct (opcional; se revalida en servidor). */
  uber_quote_id?: string | null;
}

interface ProductPriceRow {
  product_id: string;
  price: number | null;
  has_discount: boolean | null;
  discount_price: number | null;
}

interface ProductBranchRow {
  product_id: string;
}

interface ProductRow {
  id: string;
  name: string | null;
}

function extractOrderId(newOrder: unknown): string | null {
  if (newOrder == null) return null;
  if (typeof newOrder === "string") return newOrder;
  if (typeof newOrder === "object") {
    const o = newOrder as Record<string, unknown>;
    const id = o.id ?? o.order_id;
    return id != null ? String(id) : null;
  }
  return null;
}

function isDeliveryOrderType(raw: unknown): boolean {
  const t = String(raw ?? "pickup").trim().toLowerCase();
  return t === "delivery" || t === "envio" || t === "envío" || t === "despacho";
}

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function normalizeExtrasPayload(
  raw: unknown,
): Array<{ id: string; name: string; price: number; qty: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: String(o.id ?? ""),
        name: String(o.name ?? "Extra"),
        price: Math.max(0, Math.round(Number(o.price) || 0)),
        qty: Math.max(1, Math.round(Number(o.qty) || 1)),
      };
    })
    .filter((x) => x.id.trim().length > 0);
}

async function buildOrderItemsFromBranch(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  branchId: string,
  items: OrderItem[]
): Promise<OrderItem[]> {
  const requestedLines = items
    .filter((item) => Boolean(item?.id) && isUuidLike(String(item.id)))
    .map((item) => ({
      productId: String(item.id),
      quantity: Math.max(1, Number(item.quantity) || 1),
      description: item.description ?? null,
      extras_total: Math.max(0, Math.round(Number(item.extras_total) || 0)),
      extras: normalizeExtrasPayload(item.extras),
    }));

  const requestedIds = [...new Set(requestedLines.map((l) => l.productId))];
  if (requestedIds.length === 0) return [];

  const [{ data: prices, error: pricesError }, { data: branchRows, error: branchError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("product_prices")
        .select("product_id, price, has_discount, discount_price")
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .in("product_id", requestedIds),
      supabase
        .from("product_branch")
        .select("product_id")
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .in("product_id", requestedIds),
      supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .in("id", requestedIds),
    ]);

  if (pricesError || branchError || productsError) {
    throw new Error("No se pudo validar los productos de la sucursal. Intenta nuevamente.");
  }

  const typedPrices = (prices ?? []) as ProductPriceRow[];
  const typedBranchRows = (branchRows ?? []) as ProductBranchRow[];
  const typedProducts = (products ?? []) as ProductRow[];

  const pricesByProduct = new Map(typedPrices.map((row) => [String(row.product_id), row]));
  const activeBranchProducts = new Set(typedBranchRows.map((row) => String(row.product_id)));
  const productNames = new Map(typedProducts.map((row) => [String(row.id), row.name]));

  const normalizedItems: OrderItem[] = [];

  for (const line of requestedLines) {
    const { productId } = line;
    if (!activeBranchProducts.has(productId)) continue;

    const dbPriceRow = pricesByProduct.get(productId);
    if (!dbPriceRow) continue;

    const basePrice = Number(dbPriceRow.price || 0);
    const discountPrice = Number(dbPriceRow.discount_price || 0);
    const hasDiscount = Boolean(dbPriceRow.has_discount) && discountPrice > 0;
    const effectivePrice = hasDiscount ? discountPrice : basePrice;
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) continue;

    normalizedItems.push({
      id: productId,
      name: String(productNames.get(productId) || "Producto"),
      quantity: line.quantity,
      price: effectivePrice,
      has_discount: false,
      discount_price: null,
      description: line.description,
      extras_total: line.extras_total,
      extras: line.extras,
    });
  }

  return normalizedItems;
}

export const ordersService = {
  async createOrder(orderData: CreateOrderPayload, receiptFile: File | null = null) {
    const supabase = createSupabaseBrowserClient("tenant");

    if (!orderData.branch_id) {
      throw new Error("El ID de sucursal es obligatorio para crear un pedido.");
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error("El pedido debe contener al menos un producto.");
    }

    const normalizedItems = await buildOrderItemsFromBranch(
      supabase,
      orderData.branch_id,
      orderData.items
    );

    const customItems = (orderData.items ?? [])
      .filter((it) => it.custom_item === true)
      .map((it, idx) => ({
        id: `custom_${idx}_${String(it.id ?? "")}`,
        name: String(it.name ?? "Extra"),
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Math.max(0, Math.round(Number(it.price) || 0)),
        has_discount: false,
        discount_price: null,
        description: it.description ?? null,
        extras_total: 0,
        extras: normalizeExtrasPayload(it.extras),
      }));

    const itemsForRpc = [...normalizedItems, ...customItems];

    if (itemsForRpc.length === 0) {
      throw new Error(
        "Ningun producto del carrito esta disponible en esta sucursal en este momento."
      );
    }

    const { data: openShift } = await supabase
      .from("cash_shifts")
      .select("id")
      .eq("status", "open")
      .eq("branch_id", orderData.branch_id)
      .maybeSingle();

    if (!openShift) {
      throw new Error(
        "El local no esta recibiendo pedidos en este momento (Caja Cerrada)."
      );
    }

    const calculatedItemsTotal = Math.round(
      itemsForRpc.reduce((sum, item) => {
        const price =
          item.has_discount && item.discount_price && Number(item.discount_price) > 0
            ? Number(item.discount_price)
            : Number(item.price || 0);
        const extrasTotal = Math.max(0, Number(item.extras_total) || 0);
        const qty = Math.max(1, Number(item.quantity) || 1);
        return sum + (price + extrasTotal) * qty;
      }, 0)
    );

    const { data: branchCfg, error: branchCfgError } = await supabase
      .from("branches")
      .select("delivery_settings")
      .eq("id", orderData.branch_id)
      .maybeSingle();

    if (branchCfgError) {
      throw new Error("No se pudo validar la configuracion de la sucursal. Intenta nuevamente.");
    }

    const deliverySettings = normalizeDeliverySettings(branchCfg?.delivery_settings);
    const deliveryMode = isDeliveryOrderType(orderData.order_type);

    const MIN_DRIVER_REFERENCE_LEN = 6;

    let deliveryFee = 0;
    let uberQuoteIdForPatch: string | null =
      typeof orderData.uber_quote_id === "string" && orderData.uber_quote_id.trim()
        ? orderData.uber_quote_id.trim()
        : null;
    let namedId: string | null =
      typeof orderData.delivery_named_area_id === "string" && orderData.delivery_named_area_id.trim()
        ? orderData.delivery_named_area_id.trim()
        : typeof orderData.namedAreaId === "string" && orderData.namedAreaId.trim()
          ? orderData.namedAreaId.trim()
          : null;

    if (deliveryMode) {
      if (!deliverySettings.enabled) {
        throw new Error("El delivery no esta habilitado para esta sucursal.");
      }

      const daRef = orderData.delivery_address;
      const refForDriver =
        daRef && typeof daRef === "object"
          ? String((daRef as Record<string, unknown>).reference ?? "").trim()
          : "";
      if (refForDriver.length < MIN_DRIVER_REFERENCE_LEN) {
        throw new Error(
          "Agrega indicaciones para el repartidor (depto, timbre, color de porton, etc.). Minimo 6 caracteres.",
        );
      }

      const km = Number(orderData.delivery_km);
      const safeKm = Number.isFinite(km) && km >= 0 ? km : 0;
      const priceMode = effectiveDeliveryPricingMode(deliverySettings);

      if (priceMode === "named" && deliverySettings.namedAreaResolution === "address_matched") {
        const da = orderData.delivery_address;
        const addr =
          da && typeof da === "object"
            ? String(da.address ?? da.formatted_address ?? "").trim()
            : "";
        if (addr.length < 8) {
          throw new Error("Completa la direccion de entrega (calle, numero y comuna o ciudad).");
        }
        if (typeof window === "undefined") {
          throw new Error("Cotizacion por direccion no disponible en este contexto.");
        }
        const geoRes = await fetch(`${window.location.origin}/api/delivery-geocode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: orderData.branch_id,
            address: addr,
            subtotal: calculatedItemsTotal,
          }),
        });
        const geoJson = (await geoRes.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          namedAreaId?: string;
          label?: string;
        };
        if (!geoRes.ok || !geoJson.ok) {
          throw new Error(geoJson.error || "No se pudo calcular el envio segun la direccion.");
        }
        namedId = geoJson.namedAreaId ?? null;
        if (da && typeof da === "object") {
          orderData.delivery_address = {
            ...da,
            named_area_id: namedId,
            named_area_label: geoJson.label,
          };
        }
      }

      if (priceMode === "named") {
        const r = computeDeliveryFee(deliverySettings, 0, calculatedItemsTotal, {
          namedAreaId: namedId,
        });
        if (r.fee === -2) {
          throw new Error("El subtotal del pedido no alcanza el minimo requerido para delivery.");
        }
        if (r.fee === -3) {
          throw new Error("Debes elegir una zona de entrega.");
        }
        if (r.fee === -4) {
          throw new Error("La zona de entrega seleccionada no es valida.");
        }
        deliveryFee = r.fee < 0 ? 0 : r.fee;
      } else if (priceMode === "external") {
        const dlat = orderData.delivery_lat;
        const dlng = orderData.delivery_lng;
        const hasLatLng =
          typeof dlat === "number" &&
          typeof dlng === "number" &&
          Number.isFinite(dlat) &&
          Number.isFinite(dlng);
        if (!hasLatLng) {
          throw new Error(
            "Indica tu ubicacion de entrega en el mapa para continuar con el envio.",
          );
        }
        if (typeof window === "undefined") {
          throw new Error("Cotizacion de envio externo no disponible en este contexto.");
        }
        const da = orderData.delivery_address;
        const addrStr =
          da && typeof da === "object"
            ? String(
                (da as Record<string, unknown>).formatted_address ??
                  (da as Record<string, unknown>).address ??
                  "",
              ).trim()
            : "";
        const qRes = await fetch(`${window.location.origin}/api/delivery-quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: orderData.branch_id,
            subtotal: calculatedItemsTotal,
            lat: dlat,
            lng: dlng,
            ...(addrStr.length >= 8 ? { address: addrStr } : {}),
          }),
        });
        const qJson = (await qRes.json().catch(() => ({}))) as {
          ok?: boolean;
          fee?: number;
          showDeliveryFeeAmount?: boolean;
          uberQuoteId?: string | null;
          error?: string;
        };
        if (!qRes.ok || !qJson.ok) {
          throw new Error(
            qJson.error ||
              "No se pudo validar el envio con el proveedor. Verifica tu ubicacion e intenta de nuevo.",
          );
        }
        const showAmt = qJson.showDeliveryFeeAmount !== false;
        deliveryFee = showAmt ? Math.round(Math.max(0, Number(qJson.fee) || 0)) : 0;
        uberQuoteIdForPatch = showAmt
          ? typeof qJson.uberQuoteId === "string" && qJson.uberQuoteId.trim()
            ? qJson.uberQuoteId.trim()
            : uberQuoteIdForPatch
          : uberQuoteIdForPatch;
      } else {
        const dlat = orderData.delivery_lat;
        const dlng = orderData.delivery_lng;
        const hasLatLng =
          typeof dlat === "number" &&
          typeof dlng === "number" &&
          Number.isFinite(dlat) &&
          Number.isFinite(dlng);

        if (hasLatLng && typeof window !== "undefined") {
          const qRes = await fetch(`${window.location.origin}/api/delivery-quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              branchId: orderData.branch_id,
              subtotal: calculatedItemsTotal,
              lat: dlat,
              lng: dlng,
            }),
          });
          const qJson = (await qRes.json().catch(() => ({}))) as {
            ok?: boolean;
            fee?: number;
            error?: string;
          };
          if (!qRes.ok || !qJson.ok) {
            throw new Error(
              qJson.error ||
                "No se pudo validar el envio por distancia. Verifica que estes dentro del area de reparto.",
            );
          }
          deliveryFee = Math.round(Math.max(0, Number(qJson.fee) || 0));
        } else {
          if (
            deliverySettings.maxDeliveryKm != null &&
            safeKm > deliverySettings.maxDeliveryKm + 1e-9
          ) {
            throw new Error(
              "La distancia indicada supera el maximo permitido para delivery en esta sucursal.",
            );
          }
          const kmBilled = Math.max(0, Math.round(safeKm));
          const r = computeDeliveryFee(deliverySettings, kmBilled, calculatedItemsTotal);
          if (r.fee === -1) {
            throw new Error(
              "La distancia indicada supera el maximo permitido para delivery en esta sucursal.",
            );
          }
          if (r.fee === -2) {
            throw new Error("El subtotal del pedido no alcanza el minimo requerido para delivery.");
          }
          if (r.fee === -3) {
            throw new Error("Debes elegir una zona de entrega.");
          }
          if (r.fee === -4) {
            throw new Error("La zona de entrega seleccionada no es valida.");
          }
          deliveryFee = Math.round(r.fee < 0 ? 0 : r.fee);
        }
      }
    }

    deliveryFee = Math.round(deliveryFee);
    const grandTotal = calculatedItemsTotal + deliveryFee;
    const totalToUse = grandTotal;

    let receiptUrl: string | null = null;
    let receiptUploadFailed = false;

    if (orderData.payment_type === "online" && receiptFile) {
      try {
        receiptUrl = await uploadImage(receiptFile, "receipts");
      } catch {
        receiptUploadFailed = true;
      }
    }

    const paymentRefFromReceipt = receiptUrl || orderData.payment_ref;
    const paymentRef =
      paymentRefFromReceipt ||
      (orderData.payment_type === "online"
        ? orderData.payment_method_specific === "transferencia_bancaria"
          ? "Transferencia pendiente por WhatsApp"
          : "Comprobante pendiente por WhatsApp"
        : "Pago Presencial");

    let finalNote = orderData.note || "";
    if (orderData.branch_name) {
      finalNote = `[Sucursal: ${orderData.branch_name}] \n${finalNote}`.trim();
    }
    if (deliveryMode && deliveryFee > 0) {
      finalNote = `${finalNote}\n[Envio: $${Math.round(deliveryFee).toLocaleString("es-CL")}]`.trim();
    }

    const { data: newOrder, error: orderError } = await supabase.rpc(
      "create_order_transaction",
      {
        p_client_name: orderData.client_name,
        p_client_phone: orderData.client_phone,
        p_client_rut: orderData.client_rut || "",
        p_items: itemsForRpc,
        p_total: totalToUse,
        p_payment_type: orderData.payment_type,
        p_payment_ref: paymentRef,
        p_note: finalNote,
        p_branch_id: orderData.branch_id,
        p_company_id: orderData.company_id || null,
        p_status: orderData.status || "pending",
        p_payment_method_specific: orderData.payment_method_specific ?? null,
        // Sin estos campos el RPC asume pickup + fee 0 y compara mal `p_total` (subtotal+envío) → invalid_item_price.
        p_order_type: deliveryMode ? "delivery" : "pickup",
        p_delivery_fee: deliveryMode ? deliveryFee : 0,
        p_delivery_address: deliveryMode ? (orderData.delivery_address as Json) : null,
      }
    );

    if (orderError) {
      const rpcMessage = String(orderError.message || "").toLowerCase();
      if (rpcMessage.includes("invalid_item_price")) {
        throw new Error(
          "Hay productos del carrito que no estan disponibles para esta sucursal. Actualiza el menu e intenta nuevamente."
        );
      }
      if (rpcMessage.includes("no_items_available")) {
        throw new Error(
          "Ningun producto del carrito esta disponible en esta sucursal en este momento."
        );
      }
      if (rpcMessage.includes("delivery_address_required")) {
        throw new Error("Falta la direccion de entrega. Completa el formulario de delivery.");
      }
      if (rpcMessage.includes("handoff_code_collision")) {
        throw new Error("No se pudo generar el codigo de entrega. Intenta nuevamente.");
      }
      throw orderError;
    }

    const orderId = extractOrderId(newOrder);
    if (orderId && deliveryMode && typeof window !== "undefined") {
      const patchRes = await fetch(`${window.location.origin}/api/public-order-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderType: "delivery",
          deliveryKm: Number(orderData.delivery_km),
          deliveryFee,
          deliveryAddress: orderData.delivery_address ?? null,
          deliveryLat: orderData.delivery_lat,
          deliveryLng: orderData.delivery_lng,
          namedAreaId:
            typeof namedId === "string" && namedId.trim()
              ? namedId.trim()
              : undefined,
          ...(uberQuoteIdForPatch ? { uberQuoteId: uberQuoteIdForPatch } : {}),
        }),
      });
      if (!patchRes.ok) {
        const j = (await patchRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "No se pudo registrar los datos de envio del pedido.");
      }
    }

    return { order: newOrder, receiptUploadFailed };
  },
};
