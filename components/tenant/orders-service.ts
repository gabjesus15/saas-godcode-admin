import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { uploadImage } from "./utils/cloudinary";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  has_discount?: boolean;
  discount_price?: number | null;
  description?: string | null;
}

interface CreateOrderPayload {
  client_name: string;
  client_phone: string;
  client_rut?: string;
  payment_type: "online" | "tienda" | null;
  total: number;
  items: OrderItem[];
  note?: string | null;
  status?: string;
  receiptFile?: File | null;
  branch_id: string;
  branch_name?: string | null;
  company_id?: string | null;
  payment_ref?: string | null;
}

function normalizeOrderItems(items: OrderItem[]): OrderItem[] {
  return items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const basePrice = Number(item.price);
    const discountPrice = Number(item.discount_price);

    const hasValidDiscount =
      Boolean(item.has_discount) && Number.isFinite(discountPrice) && discountPrice > 0;

    const effectivePrice = hasValidDiscount ? discountPrice : basePrice;

    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
      throw new Error(`Precio inválido para el producto: ${item.name || "sin nombre"}`);
    }

    return {
      ...item,
      quantity,
      price: effectivePrice,
      has_discount: false,
      discount_price: null,
    };
  });
}

export const ordersService = {
  async createOrder(orderData: CreateOrderPayload, receiptFile: File | null = null) {
    const supabase = createSupabaseBrowserClient();

    if (!orderData.branch_id) {
      throw new Error("El ID de sucursal es obligatorio para crear un pedido.");
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error("El pedido debe contener al menos un producto.");
    }

    const normalizedItems = normalizeOrderItems(orderData.items);

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

    const calculatedTotal = normalizedItems.reduce((sum, item) => {
      const price =
        item.has_discount && item.discount_price && Number(item.discount_price) > 0
          ? Number(item.discount_price)
          : Number(item.price || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      return sum + price * qty;
    }, 0);

    const totalToUse =
      Math.abs(calculatedTotal - orderData.total) > 50
        ? calculatedTotal
        : orderData.total;

    let receiptUrl: string | null = null;
    let receiptUploadFailed = false;

    if (orderData.payment_type === "online" && receiptFile) {
      try {
        receiptUrl = await uploadImage(receiptFile, "receipts");
      } catch {
        receiptUploadFailed = true;
      }
    }

    const paymentRef =
      receiptUrl ||
      orderData.payment_ref ||
      (orderData.payment_type === "online"
        ? "Comprobante pendiente por WhatsApp"
        : "Pago Presencial");

    let finalNote = orderData.note || "";
    if (orderData.branch_name) {
      finalNote = `[Sucursal: ${orderData.branch_name}] \n${finalNote}`.trim();
    }

    const { data: newOrder, error: orderError } = await supabase.rpc(
      "create_order_transaction",
      {
        p_client_name: orderData.client_name,
        p_client_phone: orderData.client_phone,
        p_client_rut: orderData.client_rut || "",
        p_items: normalizedItems,
        p_total: totalToUse,
        p_payment_type: orderData.payment_type,
        p_payment_ref: paymentRef,
        p_note: finalNote,
        p_branch_id: orderData.branch_id,
        p_company_id: orderData.company_id || null,
        p_status: orderData.status || "pending",
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
      throw orderError;
    }

    return { order: newOrder, receiptUploadFailed };
  },
};
