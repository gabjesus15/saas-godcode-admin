"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  // ShoppingBag,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import Image from "next/image";

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

import "../../app/[subdomain]/styles/CartModal.css";
import "../../app/[subdomain]/styles/CartModal.custom.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

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
  name?: string | null;
  image_url?: string | null;
  quantity: number;
  price?: number | null;
  has_discount?: boolean | null;
  discount_price?: number | null;
  description?: string | null;
  is_active?: boolean | null;
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

const generateWSMessage = (
  formData: { name: string; rut: string; phone: string },
  cart: Array<{ name?: string | null; quantity: number; description?: string | null }>,
  total: number,
  paymentMethodKey: string | null,
  note: string,
  businessName?: string | null
) => {
  let msg = `*NUEVO PEDIDO WEB - ${businessName || "RESTAURANTE"}*\n`;
  msg += "================================\n\n";
  msg += `Cliente: ${formData.name}\n`;
  msg += `RUT: ${formData.rut}\n`;
  msg += `Fono: ${formData.phone}\n\n`;
  msg += "DETALLE:\n";
  cart.forEach((item) => {
    msg += `+ ${item.quantity} x ${(item.name ?? "").toUpperCase()}\n`;
    if (item.description) {
      msg += `   (Hacer: ${item.description})\n`;
    }
  });
  msg += `\n*TOTAL: $${total.toLocaleString("es-CL")}*\n`;
  const methodLabel = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey] ? PAYMENT_METHOD_CONFIG[paymentMethodKey].label : "Por definir";
  msg += `Pago: ${methodLabel}\n`;
  if (note && note.trim()) msg += `\nNota: ${note}\n`;
  return msg;
};

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
      cartTotal,
      getPrice,
      orderNote,
      setOrderNote,
    } = useCart();


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

  const [viewState, setViewState] = useState({
    showPaymentInfo: false,
    showForm: false,
    showSuccess: false,
    isSaving: false,
    error: null as string | null,
    receiptUploadFailed: false,
  });
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [paymentMethodKey, setPaymentMethodKey] = useState<string | null>(null);

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
    const isOnline = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline;
    const isReceiptValid = isOnline ? !!values.receiptFile : true;

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
      showForm: false,
      showSuccess: false,
      isSaving: false,
      error: null,
      receiptUploadFailed: false,
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
    setViewState((v) => ({ ...v, isSaving: true, error: null }));
    try {
      const itemsForOrder = (cart as CartLineItem[]).map((item) => ({
        id: item.id,
        name: String(item.name ?? ""),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        has_discount: Boolean(item.has_discount),
        discount_price: item.has_discount && item.discount_price != null ? Number(item.discount_price) : null,
        description: item.description ? sanitizeUserText(item.description) : null,
      }));
      const isOnline = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline;
      const orderPayload = {
        client_name: sanitizeUserText(data.name),
        client_phone: String(data.phone ?? "").trim(),
        client_rut: String(data.rut ?? "").trim(),
        payment_type: isOnline ? ('online' as const) : ('tienda' as const),
        payment_method_specific: paymentMethodKey,
        total: Number(cartTotal) || 0,
        items: itemsForOrder,
        note: sanitizeUserText(orderNote),
        status: "pending",
        receiptFile: data.receiptFile,
        branch_id: selectedBranch.id,
        branch_name: selectedBranch.name || "Desconocido",
        company_id: selectedBranch.company_id || null,
      };
      // ...existing code...
      const { receiptUploadFailed } = await ordersService.createOrder(orderPayload, data.receiptFile ?? null);
      setViewState((v) => ({
        ...v,
        showSuccess: true,
        isSaving: false,
        receiptUploadFailed: receiptUploadFailed ?? false,
      }));
      setShowFieldErrors(false);
      setTimeout(() => {
        const message = generateWSMessage(data, cart, cartTotal, paymentMethodKey, orderNote, activeInfo.name);
        let targetPhone = "56976645547";
        if (activeInfo.phone) {
          targetPhone = activeInfo.phone.replace(/\D/g, "");
        }
        // ...existing code...
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
        clearCart();
      }, 1500);
    } catch (error: unknown) {
      const errorRecord = (error ?? {}) as Record<string, unknown>;
      const message = String(errorRecord.message || "Error al procesar el pedido. Intenta nuevamente.");
      setViewState((v) => ({ ...v, isSaving: false, error: message }));
    }
  });

  if (!isCartOpen) return null;

  if (viewState.showSuccess) {
    return (
      <div className="modal-overlay cart-overlay" onClick={handleCloseCart}>
        <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
          <header className="cart-header">
            <h3>¡Pedido Enviado!</h3>
            <button onClick={handleCloseCart} className="btn-close-cart" aria-label="Cerrar"><X size={20} /></button>
          </header>
          <SuccessView
            onNewOrder={resetFlow}
            onGoHome={handleCloseCart}
            receiptUploadFailed={viewState.receiptUploadFailed}
            activeInfo={activeInfo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay cart-overlay" onClick={handleCloseCart}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <header className="cart-header">
          <div className="cart-header-main">
            <div className="cart-header-title-row">
              <h3>Tu Pedido</h3>
              <span className="cart-count-badge">{filteredCart.length}</span>
            </div>
            {selectedBranch ? <span className="cart-branch-name">{selectedBranch.name}</span> : null}
          </div>
          <button onClick={handleCloseCart} className="btn-close-cart" aria-label="Cerrar"><X size={20} /></button>
        </header>

        {viewState.error ? (
          <div className="cart-error-banner animate-fade">
            <AlertCircle size={16} /> {viewState.error}
          </div>
        ) : null}

        <div className="cart-body">
          {cart.length === 0 ? (
            <EmptyState onMenu={handleCloseCart} />
          ) : (
            <>
              <div className="cart-items-list">
                {(filteredCart as CartLineItem[]).map((item) => (
                  <CartItem
                    key={item.id}
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
          )}
        </div>

        {cart.length > 0 ? (
          <footer className="cart-footer">
            {!viewState.showPaymentInfo ? (
              <>
                <div className="total-row">
                  <span>Total</span>
                  <span className="total-price">${cartTotal.toLocaleString("es-CL")}</span>
                </div>

                {isShiftLoading ? (
                  <button className="btn btn-primary btn-block btn-lg" disabled>
                    Cargando...
                  </button>
                ) : canCheckout ? (
                  <button
                    onClick={() => {
                      setViewState((v) => ({ ...v, showPaymentInfo: true }));
                    }}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    Ir a Pagar
                  </button>
                ) : (
                  <div className="cash-closed-banner">
                    <AlertCircle size={16} />
                    <span>
                      {selectedBranch
                        ? `Esta sucursal no está recibiendo pedidos. Abre la caja en ${selectedBranch.name} para habilitar compras.`
                        : `Caja cerrada.${businessInfo?.schedule ? ` Horario: ${businessInfo.schedule}` : ""}`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <PaymentFlow
                paymentMethodKey={paymentMethodKey}
                setPaymentMethodKey={setPaymentMethodKey}
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
                cartTotal={cartTotal}
                onBack={() => setViewState((v) => ({ ...v, showPaymentInfo: false }))}
                activeInfo={activeInfo}
                setViewState={setViewState}
                viewState={viewState}
              />
            )}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

const PaymentFlow = ({
  paymentMethodKey,
  setPaymentMethodKey,
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
  setViewState: React.Dispatch<React.SetStateAction<{ showPaymentInfo: boolean; showForm: boolean; showSuccess: boolean; isSaving: boolean; error: string | null; receiptUploadFailed: boolean; }>>;
  viewState: { showPaymentInfo: boolean; showForm: boolean; showSuccess: boolean; isSaving: boolean; error: string | null; receiptUploadFailed: boolean; };
}) => {
  const isOnline = paymentMethodKey && PAYMENT_METHOD_CONFIG[paymentMethodKey]?.isOnline;
  const showNameError = showFieldErrors && !validation.name;
  const showRutError = showFieldErrors && !validation.rut;
  const showPhoneError = showFieldErrors && !validation.phone;
  const showReceiptError = showFieldErrors && isOnline && !validation.receipt;
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
      <form onSubmit={onSubmit} className="checkout-form animate-fade">
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

        {isOnline ? (
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
                if (!validation.receipt && isOnline) errors.push("comprobante");
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
    );
  }

  if (paymentMethodKey) {
    return (
      <div className="payment-details animate-fade">
        {isOnline ? (
          <OnlinePaymentDetails methodKey={paymentMethodKey} cartTotal={cartTotal} activeInfo={activeInfo} />
        ) : (
          <div className="store-pay-info glass mb-20">
            <Store size={32} className="text-accent" />
            <div>
              <h4>{PAYMENT_METHOD_CONFIG[paymentMethodKey]?.label || "Pagar en Local"}</h4>
              <p className="text-muted">Pagas en efectivo o tarjeta al retirar.</p>
            </div>
            <div className="pay-total">Total: ${cartTotal.toLocaleString("es-CL")}</div>
          </div>
        )}

        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-block mt-4">
          {isOnline ? "Ya pagué" : "Continuar"}
        </button>

        <button onClick={() => setPaymentMethodKey(null)} className="btn btn-text btn-block mt-2">
          <ArrowLeft size={16} className="mr-5" /> Elegir otro metodo
        </button>
      </div>
    );
  }

  // Mostrar lista de métodos activos de la sucursal
  const activeMethods = activeInfo.payment_methods || [];

  return (
    <div className="payment-options animate-fade">
      <h4 className="text-center mb-15 text-white">Metodo de Pago</h4>
      {activeMethods.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-4">No hay métodos de pago configurados en esta sucursal.</div>
      ) : (
        activeMethods.map(methodKey => {
          const config = PAYMENT_METHOD_CONFIG[methodKey];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <button 
              key={methodKey} 
              className="btn btn-secondary btn-block payment-opt" 
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
  );
};

const OnlinePaymentDetails = ({ methodKey, cartTotal, activeInfo }: { methodKey: string, cartTotal: number; activeInfo: ActiveSessionInfo }) => {
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
    <div className="bank-info glass">
      <h4>Datos de Pago</h4>
      {renderDetails()}
      <div className="pay-total">Total: ${cartTotal.toLocaleString("es-CL")}</div>
    </div>
  );
};

const SuccessView = ({
  onNewOrder,
  onGoHome,
  receiptUploadFailed,
  activeInfo,
}: {
  onNewOrder: () => void;
  onGoHome: () => void;
  receiptUploadFailed: boolean;
  activeInfo: BusinessInfo;
}) => (
  <div className="cart-success-view animate-fade">
    <div className="success-icon-circle">
      <Check size={40} />
    </div>
    <h2 className="text-accent">¡Pedido Recibido!</h2>
    <p className="success-description">
      Estamos validando tu pago. Te contactaremos por WhatsApp.
    </p>
    {receiptUploadFailed ? (
      <p className="cart-receipt-fallback cart-receipt-fallback-warning">
        No se pudo subir el comprobante. Por favor envialo por WhatsApp cuando abras el chat.
      </p>
    ) : null}
    <div className="order-summary-card">
      <div className="summary-label">Retiro en</div>
      <div className="summary-value">{activeInfo?.address || "Direccion no disponible"}</div>
      <div className="text-xs text-muted">{activeInfo?.name || "Nombre del local"}</div>
    </div>
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
  onAdd: (item: CartLineItem) => void;
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

  return (
    <div className="cart-item">
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
    <div className="item-details item-details-tight">
      <div className="item-top">
        <h4 className="item-title">{item.name}</h4>
        <button
          onClick={() => onRemove(item.id)}
          className="btn-trash"
          aria-label="Quitar producto"
          title="Quitar producto"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="item-bottom item-bottom-tight">
        <span className="item-price item-price-strong">
          ${(unitPrice * item.quantity).toLocaleString("es-CL")}
        </span>
        <div className="qty-control-sm">
          <button
            onClick={() => onDecrease(item.id)}
            aria-label="Disminuir cantidad"
            title="Disminuir cantidad"
          >
            <Minus size={12} />
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={() => onAdd(item)}
            aria-label="Aumentar cantidad"
            title="Aumentar cantidad"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};
