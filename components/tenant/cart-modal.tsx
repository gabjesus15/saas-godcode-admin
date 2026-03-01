"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useCart } from "./use-cart";
import { ordersService } from "./orders-service";
import { formatRut, validateRut } from "./utils/formatters";
import { getCloudinaryOptimizedUrl, validateImageFile } from "./utils/cloudinary";
import { getTenantScopedPath } from "./utils/tenant-route";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";

import "../../app/[subdomain]/styles/CartModal.css";

const FALLBACK_IMAGE = "/placeholder.svg";

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

interface BranchInfo {
  id: string;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  company_id?: string | null;
  bank_name?: string | null;
  account_type?: string | null;
  account_number?: string | null;
  account_rut?: string | null;
  account_email?: string | null;
  account_holder?: string | null;
}

const generateWSMessage = (
  formData: { name: string; rut: string; phone: string },
  cart: Array<{ name?: string | null; quantity: number; description?: string | null }>,
  total: number,
  paymentType: "online" | "tienda" | null,
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
  msg += `Pago: ${paymentType === "online" ? "Transferencia (Comprobante Adjunto)" : "En Local"}\n`;
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
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const homePath = useMemo(
    () => getTenantScopedPath(pathname ?? "/", "/"),
    [pathname]
  );

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

  const [viewState, setViewState] = useState({
    showPaymentInfo: false,
    showForm: false,
    showSuccess: false,
    isSaving: false,
    error: null as string | null,
    receiptUploadFailed: false,
  });
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [paymentType, setPaymentType] = useState<"online" | "tienda" | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "+56 9 ",
    rut: "",
    receiptFile: null as File | null,
    receiptPreview: null as string | null,
  });

  const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(true);

  useEffect(() => {
    if (!selectedBranch?.id) {
      setIsShiftOpen(false);
      setIsShiftLoading(false);
      return;
    }

    let cancelled = false;
    setIsShiftLoading(true);

    supabase
      .from("cash_shifts")
      .select("id")
      .eq("status", "open")
      .eq("branch_id", selectedBranch.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setIsShiftOpen(Boolean(data) || Boolean(error));
        setIsShiftLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBranch?.id, supabase]);

  const canCheckout = isShiftOpen;

  const activeInfo = useMemo(() => {
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
      if (formData.receiptPreview) URL.revokeObjectURL(formData.receiptPreview);
    };
  }, [formData.receiptPreview]);

  const validation = useMemo(() => {
    const phoneDigits = formData.phone.replace(/\D/g, "").length;
    const isRutValid = validateRut(formData.rut);
    const nameValue = formData.name.trim();
    const namePattern = /^[\p{L} .'-]+$/u;
    const isNameValid = nameValue.length > 2 && namePattern.test(nameValue);
    const isReceiptValid = paymentType === "online" ? !!formData.receiptFile : true;

    return {
      rut: isRutValid,
      phone: phoneDigits >= 11,
      name: isNameValid,
      receipt: isReceiptValid,
      isReady: isNameValid && phoneDigits >= 11 && isRutValid && isReceiptValid,
    };
  }, [formData, paymentType]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      let finalValue = value;
      if (field === "rut") finalValue = formatRut(value);
      if (field === "phone") {
        if (!value.startsWith("+56 9")) {
          if (value.length < 6) return { ...prev, [field]: "+56 9 " };
        }
        finalValue = value;
      }
      return { ...prev, [field]: finalValue };
    });
    setViewState((prev) => ({ ...prev, error: null }));
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (formData.receiptPreview) URL.revokeObjectURL(formData.receiptPreview);
        const { valid, error: validationError } = validateImageFile(file);
        if (!valid) {
          setViewState((prev) => ({
            ...prev,
            error: validationError || "Archivo no valido.",
          }));
          return;
        }
        setFormData((prev) => ({
          ...prev,
          receiptFile: file,
          receiptPreview: URL.createObjectURL(file),
        }));
        setViewState((prev) => ({ ...prev, error: null }));
      }
    },
    [formData.receiptPreview]
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
    setPaymentType(null);
    setFormData({ name: "", phone: "+56 9 ", rut: "", receiptFile: null, receiptPreview: null });
    setShowFieldErrors(false);
  }, []);

  const handleCloseCart = useCallback(() => {
    if (viewState.showSuccess) {
      toggleCart();
      return;
    }
    toggleCart();
    setTimeout(resetFlow, 300);
  }, [viewState.showSuccess, toggleCart, resetFlow]);

  const handleSendOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCheckout) {
      const msg = selectedBranch
        ? `Esta sucursal (${selectedBranch.name}) no esta recibiendo pedidos. Abre la caja en el admin para habilitar compras.`
        : businessInfo?.schedule
          ? `Nuestro horario es: ${businessInfo.schedule}`
          : "No se pueden recibir pedidos en este momento.";
      setViewState((v) => ({ ...v, isSaving: false, error: msg }));
      return;
    }

    if (viewState.isSaving) return;

    if (!validation.isReady) {
      setShowFieldErrors(true);
      setViewState((prev) => ({ ...prev, error: "Por favor completa todos los campos correctamente." }));
      return;
    }

    if (!selectedBranch?.id) {
      setViewState((prev) => ({
        ...prev,
        error: "No hay sucursal seleccionada. Elige una sucursal para enviar el pedido.",
      }));
      return;
    }

    setViewState((v) => ({ ...v, isSaving: true, error: null }));

    try {
      const sanitizeInput = (text: string) => (text ? text.replace(/<[^>]*>?/gm, "").trim() : "");

      const itemsForOrder = cart.map((item: any) => ({
        id: item.id,
        name: String(item.name ?? ""),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        has_discount: Boolean(item.has_discount),
        discount_price: item.has_discount && item.discount_price != null ? Number(item.discount_price) : null,
        description: item.description ? String(item.description) : null,
      }));

      const orderPayload = {
        client_name: sanitizeInput(formData.name),
        client_phone: String(formData.phone ?? "").trim(),
        client_rut: String(formData.rut ?? "").trim(),
        payment_type: paymentType,
        total: Number(cartTotal) || 0,
        items: itemsForOrder,
        note: sanitizeInput(orderNote),
        status: "pending",
        receiptFile: formData.receiptFile,
        branch_id: selectedBranch.id,
        branch_name: selectedBranch.name || "Desconocido",
        company_id: selectedBranch.company_id || null,
      };

      const { receiptUploadFailed } = await ordersService.createOrder(orderPayload, formData.receiptFile);

      setViewState((v) => ({
        ...v,
        showSuccess: true,
        isSaving: false,
        receiptUploadFailed: receiptUploadFailed ?? false,
      }));
      setShowFieldErrors(false);

      setTimeout(() => {
        const message = generateWSMessage(formData, cart, cartTotal, paymentType, orderNote, activeInfo.name);
        let targetPhone = "56976645547";
        if (activeInfo.phone) {
          targetPhone = activeInfo.phone.replace(/\D/g, "");
        }

        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
        clearCart();
      }, 1500);
    } catch (error: any) {
      const message = error?.message || error?.error_description || "Error al procesar el pedido. Intenta nuevamente.";
      setViewState((v) => ({ ...v, isSaving: false, error: message }));
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="modal-overlay cart-overlay" onClick={handleCloseCart}>
      <div className="cart-panel glass animate-slide-in" onClick={(event) => event.stopPropagation()}>
        {viewState.showSuccess ? (
          <SuccessView
            onNewOrder={resetFlow}
            onGoHome={() => {
              resetFlow();
              router.push(homePath);
            }}
            receiptUploadFailed={viewState.receiptUploadFailed}
            activeInfo={activeInfo}
          />
        ) : (
          <>
            <header className="cart-header">
              <div className="flex-center">
                <ShoppingBag size={22} className="text-accent" />
                <h3>
                  Tu Pedido {selectedBranch ? <span style={{ fontSize: "0.7em", opacity: 0.7 }}>({selectedBranch.name})</span> : null}
                </h3>
                <span className="cart-count-badge">{cart.reduce((a: number, c: any) => a + c.quantity, 0)}</span>
              </div>
              <button onClick={handleCloseCart} className="btn-close-cart">
                <X size={24} />
              </button>
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
                    {cart.map((item: any) => (
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
                      placeholder="Ej: Sin sesamo..."
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
                        onClick={() => setViewState((v) => ({ ...v, showPaymentInfo: true }))}
                        className="btn btn-primary btn-block btn-lg"
                      >
                        Ir a Pagar
                      </button>
                    ) : (
                      <div className="cash-closed-banner">
                        <AlertCircle size={16} />
                        <span>
                          {selectedBranch
                            ? `Esta sucursal no esta recibiendo pedidos. Abre la caja en ${selectedBranch.name} para habilitar compras.`
                            : `Caja cerrada.${businessInfo?.schedule ? ` Horario: ${businessInfo.schedule}` : ""}`}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <PaymentFlow
                    paymentType={paymentType}
                    setPaymentType={setPaymentType}
                    showForm={viewState.showForm}
                    setShowForm={(value: boolean) => setViewState((v) => ({ ...v, showForm: value }))}
                    formData={formData}
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
                  />
                )}
              </footer>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

const PaymentFlow = ({
  paymentType,
  setPaymentType,
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
}: {
  paymentType: "online" | "tienda" | null;
  setPaymentType: (value: "online" | "tienda" | null) => void;
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
  activeInfo: BusinessInfo;
}) => {
  const showNameError = showFieldErrors && !validation.name;
  const showRutError = showFieldErrors && !validation.rut;
  const showPhoneError = showFieldErrors && !validation.phone;
  const showReceiptError = showFieldErrors && paymentType === "online" && !validation.receipt;

  if (paymentType && showForm) {
    return (
      <form onSubmit={onSubmit} className="checkout-form animate-fade">
        <h4 className="form-title">
          <MessageCircle size={18} /> Datos del Cliente
        </h4>

        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(event) => onInputChange("name", event.target.value)}
            className="form-input"
            placeholder="Tu nombre"
            aria-invalid={showNameError}
          />
          {showNameError ? <p className="field-error">Nombre invalido. Usa solo letras y espacios.</p> : null}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              RUT {validation.rut ? <CheckCircle2 size={14} color="#25d366" /> : null}
            </label>
            <input
              type="text"
              required
              value={formData.rut}
              onChange={(event) => onInputChange("rut", event.target.value)}
              className={`form-input ${!validation.rut && formData.rut.length > 3 ? "input-error" : ""}`}
              placeholder="12.345.678-9"
              maxLength={12}
              aria-invalid={showRutError}
            />
            {showRutError ? <p className="field-error">RUT invalido. Revisa el formato.</p> : null}
          </div>
          <div className="form-group">
            <label>
              Telefono {validation.phone ? <CheckCircle2 size={14} color="#25d366" /> : null}
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(event) => onInputChange("phone", event.target.value)}
              className="form-input"
              aria-invalid={showPhoneError}
            />
            {showPhoneError ? <p className="field-error">Telefono incompleto. Usa el formato +56 9.</p> : null}
          </div>
        </div>

        {paymentType === "online" ? (
          <div className="form-group">
            <label>
              Comprobante {validation.receipt ? <CheckCircle2 size={14} color="#25d366" /> : <span className="text-accent">*</span>}
            </label>
            <div
              className="upload-box"
              onClick={() => document.getElementById("receipt-upload")?.click()}
              style={{ borderColor: formData.receiptPreview ? "#25d366" : "var(--card-border)" }}
            >
              <input type="file" id="receipt-upload" accept="image/*" hidden onChange={onFileChange} />
              {formData.receiptPreview ? (
                <div className="file-preview-row">
                  <img src={formData.receiptPreview} alt="Comprobante" />
                  <span>Imagen cargada</span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={20} /> <span>Subir captura</span>
                </div>
              )}
            </div>
            {showReceiptError ? (
              <p className="field-error">Debes adjuntar el comprobante de transferencia.</p>
            ) : null}
          </div>
        ) : null}

        <div className="form-actions-col mt-20">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary btn-block"
            onClick={() => {
              if (!validation.isReady) setShowFieldErrors(true);
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

  if (paymentType) {
    return (
      <div className="payment-details animate-fade">
        {paymentType === "online" ? (
          <BankInfo cartTotal={cartTotal} activeInfo={activeInfo} />
        ) : (
          <div className="store-pay-info glass mb-20">
            <Store size={32} className="text-accent" />
            <div>
              <h4>Pagar en Local</h4>
              <p className="text-muted">Pagas en efectivo o tarjeta al retirar.</p>
            </div>
            <div className="pay-total">Total: ${cartTotal.toLocaleString("es-CL")}</div>
          </div>
        )}

        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-block mt-4">
          {paymentType === "online" ? "Ya pague" : "Continuar"}
        </button>

        <button onClick={() => setPaymentType(null)} className="btn btn-text btn-block mt-2">
          <ArrowLeft size={16} className="mr-5" /> Elegir otro metodo
        </button>
      </div>
    );
  }

  return (
    <div className="payment-options animate-fade">
      <h4 className="text-center mb-15 text-white">Metodo de Pago</h4>
      <button className="btn btn-secondary btn-block payment-opt" onClick={() => setPaymentType("online")}>
        <CreditCard size={20} className="mr-5" /> Transferencia
      </button>
      <button className="btn btn-secondary btn-block payment-opt" onClick={() => setPaymentType("tienda")}>
        <Store size={20} className="mr-5" /> Pagar en Local
      </button>
      <button onClick={onBack} className="btn btn-text btn-block mt-2">
        Cancelar
      </button>
    </div>
  );
};

const BankInfo = ({ cartTotal, activeInfo }: { cartTotal: number; activeInfo: BusinessInfo }) => {
  const info = activeInfo || {};
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const hasData =
    info.bank_name || info.account_number || info.account_rut || info.account_email || info.account_holder;

  return (
    <div className="bank-info glass">
      <h4>Datos para Transferir</h4>
      {hasData ? (
        <ul className="bank-details-list">
          {info.bank_name ? (
            <li>
              <span>Banco:</span> <b>{info.bank_name}</b>
            </li>
          ) : null}
          {info.account_type ? (
            <li>
              <span>Tipo:</span> <b>{info.account_type}</b>
            </li>
          ) : null}
          {info.account_number ? (
            <li className="copy-row" onClick={() => copyToClipboard(info.account_number || "")}> 
              <span>Cuenta:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <b>{info.account_number}</b> <Copy size={14} />
              </div>
            </li>
          ) : null}
          {info.account_rut ? (
            <li className="copy-row" onClick={() => copyToClipboard(info.account_rut || "")}> 
              <span>RUT:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <b>{info.account_rut}</b> <Copy size={14} />
              </div>
            </li>
          ) : null}
          {info.account_email ? (
            <li className="copy-row" onClick={() => copyToClipboard(info.account_email || "")}> 
              <span>Email:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <b>{info.account_email}</b> <Copy size={14} />
              </div>
            </li>
          ) : null}
          {info.account_holder ? (
            <li>
              <span>Nombre:</span> <b>{info.account_holder}</b>
            </li>
          ) : null}
        </ul>
      ) : (
        <p style={{ color: "#9ca3af", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>
          No hay datos de transferencia configurados.
          <br />
          Contacta al administrador.
        </p>
      )}
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
    <p style={{ color: "#aaa", marginBottom: "20px" }}>
      Estamos validando tu pago. Te contactaremos por WhatsApp.
    </p>
    {receiptUploadFailed ? (
      <p className="cart-receipt-fallback" style={{ color: "#f59e0b", marginBottom: "16px", fontSize: "0.9rem" }}>
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
  item: any;
  unitPrice: number;
  onRemove: (id: string) => void;
  onAdd: (item: any) => void;
  onDecrease: (id: string) => void;
}) => (
  <div className="cart-item">
    <img
      src={
        getCloudinaryOptimizedUrl(item.image_url, {
          width: 120,
          height: 120,
          crop: "fill",
          gravity: "auto",
        }) || FALLBACK_IMAGE
      }
      alt={item.name}
      className="item-thumb"
      onError={(event) => {
        (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
      }}
    />
    <div className="item-details" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div className="item-top">
        <h4 style={{ margin: 0 }}>{item.name}</h4>
        <button onClick={() => onRemove(item.id)} className="btn-trash">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="item-bottom" style={{ marginTop: "auto", paddingTop: "4px" }}>
        <span className="item-price" style={{ fontWeight: "bold" }}>
          ${(unitPrice * item.quantity).toLocaleString("es-CL")}
        </span>
        <div className="qty-control-sm">
          <button onClick={() => onDecrease(item.id)}>
            <Minus size={12} />
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => onAdd(item)}>
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  </div>
);
