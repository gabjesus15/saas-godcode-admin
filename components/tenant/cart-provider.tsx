"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import CartContext from "./cart-context";
import type { CartFulfillment } from "./cart-context";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { filterValidProductIds, isValidBranchId } from "./utils/safe-ids";
import { mergeCartWithBranchPrices } from "./utils/cart-pricing";
import {
	computeDeliveryFee,
	effectiveDeliveryPricingMode,
	normalizeDeliverySettings,
} from "../../lib/delivery-settings";
import { haversineKm, isValidLatLng } from "../../lib/geo";
import { formatCartMoney } from "./utils/format-cart-money";

interface CartItem {
  id: string;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  has_discount?: boolean | null;
  discount_price?: number | null;
  quantity: number;
  is_active?: boolean | null;
}

interface CartProduct {
  id: string;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  has_discount?: boolean | null;
  discount_price?: number | null;
  is_active?: boolean | null;
}

interface CartState {
  cart: CartItem[];
  isCartOpen: boolean;
  orderNote: string;
  storedBranchId?: string | null;
  fulfillment: CartFulfillment;
  deliveryLine1: string;
  deliveryCommune: string;
  deliveryReference: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  deliveryNamedAreaId: string | null;
  deliveryKmManual: string;
  showDeliveryReference: boolean;
  toggleCart?: () => void;
  addToCart?: (product: CartProduct) => void;
  decreaseQuantity?: (productId: string) => void;
  removeFromCart?: (id: string) => void;
  clearCart?: () => void;
  setOrderNote?: (note: string) => void;
  setCart?: (cart: CartItem[]) => void;
  setStoredBranchId?: (id: string | null) => void;
  setFulfillment?: (value: CartFulfillment) => void;
  setDeliveryLine1?: (value: string) => void;
  setDeliveryCommune?: (value: string) => void;
  setDeliveryReference?: (value: string) => void;
  setDeliveryCoords?: (lat: number | null, lng: number | null) => void;
  setDeliveryNamedAreaId?: (id: string | null) => void;
  setDeliveryKmManual?: (value: string) => void;
  setShowDeliveryReference?: (value: boolean) => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isCartOpen: false,
      orderNote: "",
      storedBranchId: null,
      fulfillment: "pickup",
      deliveryLine1: "",
      deliveryCommune: "",
      deliveryReference: "",
      deliveryLat: null,
      deliveryLng: null,
      deliveryNamedAreaId: null,
      deliveryKmManual: "",
      showDeliveryReference: false,

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addToCart: (product) => set((state) => {
        if (!product?.id) return {};
        const existing = state.cart.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= 20) return {};
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        const newItem: CartItem = {
          id: product.id,
          name: product.name ?? null,
          description: product.description ?? null,
          image_url: product.image_url ?? null,
          price: product.price ?? null,
          has_discount: product.has_discount ?? null,
          discount_price: product.discount_price ?? null,
          is_active: product.is_active ?? null,
          quantity: 1,
        };
        return { cart: [...state.cart, newItem] };
      }),

      decreaseQuantity: (productId) => set((state) => ({
        cart: state.cart
          .map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.max(0, item.quantity - 1) }
              : item
          )
          .filter((item) => item.quantity > 0),
      })),

      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== id),
      })),

      clearCart: () =>
        set({
          cart: [],
          orderNote: "",
          fulfillment: "pickup",
          deliveryLine1: "",
          deliveryCommune: "",
          deliveryReference: "",
          deliveryLat: null,
          deliveryLng: null,
          deliveryNamedAreaId: null,
          deliveryKmManual: "",
          showDeliveryReference: false,
        }),

      setOrderNote: (note) => set({ orderNote: note }),

      setCart: (newCart) => set({ cart: newCart }),

      setStoredBranchId: (id) => set({ storedBranchId: id }),

      setFulfillment: (value) => set({ fulfillment: value }),

      setDeliveryLine1: (value) => set({ deliveryLine1: value }),

      setDeliveryCommune: (value) => set({ deliveryCommune: value }),

      setDeliveryReference: (value) => set({ deliveryReference: value }),

      setDeliveryCoords: (lat, lng) => set({ deliveryLat: lat, deliveryLng: lng }),

      setDeliveryNamedAreaId: (id) => set({ deliveryNamedAreaId: id }),

      setDeliveryKmManual: (value) => set({ deliveryKmManual: value }),

      setShowDeliveryReference: (value) => set({ showDeliveryReference: value }),
    }),
    {
      name: "tenant_cart_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        orderNote: state.orderNote,
        storedBranchId: state.storedBranchId,
      }),
    }
  )
);

export function CartProvider({
  children,
  selectedBranchId,
  branchDeliverySettings,
  branchOriginLat,
  branchOriginLng,
}: {
  children: React.ReactNode;
  selectedBranchId?: string | null;
  branchDeliverySettings?: unknown;
  branchOriginLat?: number | null;
  branchOriginLng?: number | null;
}) {
    const store = useCartStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const supabase = useMemo(() => createSupabaseBrowserClient("tenant"), []);

    const parsedDelivery = useMemo(
      () => normalizeDeliverySettings(branchDeliverySettings),
      [branchDeliverySettings]
    );

    const pricingMode = useMemo(
      () => effectiveDeliveryPricingMode(parsedDelivery),
      [parsedDelivery]
    );

    useEffect(() => {
      if (typeof window === "undefined") return;
      const setHydrated = () => setIsHydrated(true);
      try {
        const persistApi = (useCartStore as { persist?: { hasHydrated?: () => boolean; onFinishHydration?: (cb: () => void) => () => void } }).persist;
        if (persistApi?.hasHydrated?.()) {
          setHydrated();
          return;
        }
        const unsub = persistApi?.onFinishHydration?.(setHydrated);
        if (typeof unsub === "function") {
          const t = window.setTimeout(setHydrated, 200);
          return () => {
            unsub();
            window.clearTimeout(t);
          };
        }
      } catch {}
      window.requestAnimationFrame(() => window.requestAnimationFrame(setHydrated));
      const fallback = window.setTimeout(setHydrated, 250);
      return () => window.clearTimeout(fallback);
    }, []);

    useEffect(() => {
      if (!isHydrated) return;
      const { setStoredBranchId, storedBranchId, clearCart } = useCartStore.getState();
      if (!selectedBranchId) {
        if (storedBranchId !== null) {
          if (typeof setStoredBranchId === "function") setStoredBranchId(null);
          if (typeof clearCart === "function") clearCart();
        }
        return;
      }
      if (storedBranchId !== selectedBranchId) {
        if (typeof clearCart === "function") clearCart();
        if (typeof setStoredBranchId === "function") setStoredBranchId(selectedBranchId);
      }
    }, [isHydrated, selectedBranchId]);

    useEffect(() => {
      if (!isHydrated || !selectedBranchId) return;
      const st = useCartStore.getState();
      const setF = st.setFulfillment;
      if (typeof setF !== "function") return;
      if (!parsedDelivery.enabled && st.fulfillment === "delivery") {
        setF("pickup");
      }
    }, [isHydrated, selectedBranchId, parsedDelivery.enabled]);

    const cartProductIds = useMemo(
      () => isHydrated ? store.cart.map((item) => item.id).join(",") : "",
      [store.cart, isHydrated]
    );

    useEffect(() => {
      if (!isHydrated || !cartProductIds || !selectedBranchId) return;
      if (!isValidBranchId(selectedBranchId)) return;

      let cancelled = false;

      type PriceRow = {
        product_id: string;
        price: number;
        has_discount: boolean;
        discount_price: number;
        products?: {
          id: string;
          name?: string | null;
          is_active?: boolean | null;
          description?: string | null;
        };
      };

      const validatePrices = async () => {
        const ids = filterValidProductIds(cartProductIds.split(","));
        if (ids.length === 0) return;

        try {
          const { data, error } = await supabase
            .from("product_prices")
            .select(
              "product_id, price, has_discount, discount_price, products(id,name,is_active,description)"
            )
            .in("product_id", ids)
            .eq("branch_id", selectedBranchId);

          if (cancelled || error) return;

          const rows = (data || []).map((row: PriceRow) => ({
            product_id: String(row.product_id),
            price: Number(row.price),
            has_discount: Boolean(row.has_discount),
            discount_price: Number(row.discount_price),
            products: row.products
              ? {
                  id: String(row.products.id),
                  name: row.products.name ?? null,
                  is_active: row.products.is_active ?? null,
                  description: row.products.description ?? null,
                }
              : undefined,
          }));
          const currentCart = useCartStore.getState().cart;
          const nextCart = mergeCartWithBranchPrices(currentCart, rows, {
            omitLinesWithoutPriceWhenBranchHasData: false,
          });

          const isSame = JSON.stringify(currentCart) === JSON.stringify(nextCart);
          const wouldClear = (data?.length === 0 || !data) && currentCart.length > 0 && nextCart.length < currentCart.length;
          if (!isSame && !wouldClear && typeof store.setCart === "function") {
            store.setCart(nextCart);
          }
        } catch (err) {
          console.error("Error validando precios:", err);
        }
      };

      validatePrices();
      return () => { cancelled = true; };
    }, [selectedBranchId, cartProductIds, supabase, isHydrated, store]);

    const getPrice = useCallback((product: CartProduct | CartItem) => {
      if (typeof product !== "object" || product == null) return 0;
      if (product.has_discount && typeof product.discount_price === "number" && product.discount_price > 0) {
        return product.discount_price;
      }
      if (typeof product.price === "number") return product.price;
      return 0;
    }, []);

    const cartTotal = useMemo(() => {
      if (!Array.isArray(store.cart)) return 0;
      return store.cart.reduce((acc, item) => {
        const price = getPrice(item);
        if (typeof item.quantity !== "number" || item.quantity < 1) return acc;
        return acc + price * item.quantity;
      }, 0);
    }, [store.cart, getPrice]);

    const cartSubtotal = cartTotal;

    const haversineKmVal = useMemo(() => {
      if (
        pricingMode !== "distance" ||
        store.fulfillment !== "delivery" ||
        !parsedDelivery.enabled
      ) {
        return null;
      }
      if (
        !isValidLatLng(branchOriginLat, branchOriginLng) ||
        !isValidLatLng(store.deliveryLat, store.deliveryLng)
      ) {
        return null;
      }
      return haversineKm(
        { lat: branchOriginLat as number, lng: branchOriginLng as number },
        { lat: store.deliveryLat as number, lng: store.deliveryLng as number }
      );
    }, [
      pricingMode,
      store.fulfillment,
      store.deliveryLat,
      store.deliveryLng,
      branchOriginLat,
      branchOriginLng,
      parsedDelivery.enabled,
    ]);

    const manualKmParsed = useMemo(() => {
      const n = Number(String(store.deliveryKmManual).replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    }, [store.deliveryKmManual]);

    const [addrQuote, setAddrQuote] = useState<{
      fee: number;
      label: string;
      waived: boolean;
    } | null>(null);
    const [addrLoading, setAddrLoading] = useState(false);
    const [addrError, setAddrError] = useState<string | null>(null);

    const [distQuote, setDistQuote] = useState<{
      fee: number;
      distanceKm: number;
      waived: boolean;
    } | null>(null);
    const [distError, setDistError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;

      const clearAddr = () => {
        window.setTimeout(() => {
          if (!cancelled) {
            setAddrQuote(null);
            setAddrError(null);
            setAddrLoading(false);
          }
        }, 0);
      };

      if (
        store.fulfillment !== "delivery" ||
        !parsedDelivery.enabled ||
        pricingMode !== "named" ||
        parsedDelivery.namedAreaResolution !== "address_matched" ||
        !selectedBranchId
      ) {
        clearAddr();
        return () => {
          cancelled = true;
        };
      }

      const addr = `${store.deliveryLine1}, ${store.deliveryCommune}`.trim();
      if (addr.length < 8) {
        clearAddr();
        return () => {
          cancelled = true;
        };
      }
      const t = window.setTimeout(() => {
        setAddrLoading(true);
        setAddrError(null);
        fetch("/api/delivery-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedBranchId,
            subtotal: cartSubtotal,
            address: addr,
          }),
        })
          .then(async (r) => {
            const j = (await r.json()) as {
              ok?: boolean;
              fee?: number;
              label?: string;
              waivedFreeShipping?: boolean;
              error?: string;
            };
            if (cancelled) return;
            if (!r.ok || !j.ok) {
              setAddrQuote(null);
              setAddrError(j.error || "No se pudo cotizar el envio.");
              return;
            }
            setAddrQuote({
              fee: Number(j.fee) || 0,
              label: String(j.label || ""),
              waived: Boolean(j.waivedFreeShipping),
            });
          })
          .catch(() => {
            if (!cancelled) {
              setAddrQuote(null);
              setAddrError("Error de red al cotizar.");
            }
          })
          .finally(() => {
            if (!cancelled) setAddrLoading(false);
          });
      }, 420);

      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }, [
      store.fulfillment,
      store.deliveryLine1,
      store.deliveryCommune,
      parsedDelivery.enabled,
      parsedDelivery.namedAreaResolution,
      pricingMode,
      selectedBranchId,
      cartSubtotal,
    ]);

    useEffect(() => {
      let cancelled = false;

      const clearDist = () => {
        window.setTimeout(() => {
          if (!cancelled) {
            setDistQuote(null);
            setDistError(null);
          }
        }, 0);
      };

      if (
        store.fulfillment !== "delivery" ||
        !parsedDelivery.enabled ||
        pricingMode !== "distance" ||
        !selectedBranchId
      ) {
        clearDist();
        return () => {
          cancelled = true;
        };
      }

      if (
        !isValidLatLng(store.deliveryLat, store.deliveryLng)
      ) {
        clearDist();
        return () => {
          cancelled = true;
        };
      }
      const t = window.setTimeout(() => {
        if (cancelled) return;
        setDistQuote(null);
        setDistError(null);
        fetch("/api/delivery-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedBranchId,
            subtotal: cartSubtotal,
            lat: store.deliveryLat,
            lng: store.deliveryLng,
          }),
        })
          .then(async (r) => {
            const j = (await r.json()) as {
              ok?: boolean;
              fee?: number;
              distanceKm?: number;
              waivedFreeShipping?: boolean;
              error?: string;
            };
            if (cancelled) return;
            if (!r.ok || !j.ok) {
              setDistQuote(null);
              setDistError(j.error || "No se pudo cotizar por distancia.");
              return;
            }
            setDistQuote({
              fee: Number(j.fee) || 0,
              distanceKm: Number(j.distanceKm) || 0,
              waived: Boolean(j.waivedFreeShipping),
            });
          })
          .catch(() => {
            if (!cancelled) {
              setDistQuote(null);
              setDistError("Error de red al cotizar.");
            }
          });
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }, [
      store.fulfillment,
      store.deliveryLat,
      store.deliveryLng,
      parsedDelivery.enabled,
      pricingMode,
      selectedBranchId,
      cartSubtotal,
    ]);

    const { deliveryFee, waivedFree, namedLabel, quotedRouteKm, outOfZone, quoteLoading, quoteError } =
      useMemo(() => {
        if (store.fulfillment !== "delivery" || !parsedDelivery.enabled) {
          return {
            deliveryFee: 0,
            waivedFree: false,
            namedLabel: null as string | null,
            quotedRouteKm: null as number | null,
            outOfZone: false,
            quoteLoading: false,
            quoteError: null as string | null,
          };
        }

        const minOk =
          parsedDelivery.minOrderSubtotal == null ||
          cartSubtotal + 1e-9 >= parsedDelivery.minOrderSubtotal;

        if (!minOk) {
          return {
            deliveryFee: 0,
            waivedFree: false,
            namedLabel: null,
            quotedRouteKm: null,
            outOfZone: false,
            quoteLoading: false,
            quoteError: null,
          };
        }

        if (pricingMode === "named") {
          if (parsedDelivery.namedAreaResolution === "address_matched") {
            return {
              deliveryFee: addrQuote?.fee ?? 0,
              waivedFree: addrQuote?.waived ?? false,
              namedLabel: addrQuote?.label ?? null,
              quotedRouteKm: null,
              outOfZone: false,
              quoteLoading: addrLoading,
              quoteError: addrError,
            };
          }
          const id = store.deliveryNamedAreaId;
          const r = computeDeliveryFee(parsedDelivery, 0, cartSubtotal, {
            namedAreaId: id,
          });
          return {
            deliveryFee: r.fee < 0 ? 0 : r.fee,
            waivedFree: r.waivedFreeShipping,
            namedLabel:
              id != null
                ? parsedDelivery.namedAreas.find((a) => a.id === id)?.name ?? null
                : null,
            quotedRouteKm: null,
            outOfZone: false,
            quoteLoading: false,
            quoteError: r.fee === -4 ? "Zona no valida." : null,
          };
        }

        // Modo distancia: con coordenadas GPS la tarifa debe venir solo del servidor
        // (/api/delivery-quote). Antes se mezclaba haversine local y podía mostrar $0 o un
        // monto distinto al que valida el checkout.
        const hasGps = isValidLatLng(store.deliveryLat, store.deliveryLng);
        if (hasGps && selectedBranchId) {
          if (distQuote) {
            return {
              deliveryFee: distQuote.fee,
              waivedFree: distQuote.waived,
              namedLabel: null,
              quotedRouteKm: distQuote.distanceKm,
              outOfZone: false,
              quoteLoading: false,
              quoteError: null,
            };
          }
          if (distError) {
            const apiOutOfZone =
              /distancia fuera|fuera del m[aá]ximo|m[aá]ximo permitido/i.test(
                distError,
              );
            return {
              deliveryFee: 0,
              waivedFree: false,
              namedLabel: null,
              quotedRouteKm: haversineKmVal,
              outOfZone: apiOutOfZone,
              quoteLoading: false,
              quoteError: distError,
            };
          }
          return {
            deliveryFee: 0,
            waivedFree: false,
            namedLabel: null,
            quotedRouteKm: haversineKmVal,
            outOfZone: false,
            quoteLoading: true,
            quoteError: null,
          };
        }

        const kmLocal =
          haversineKmVal ??
          (Number.isFinite(manualKmParsed) ? manualKmParsed : 0);
        const r = computeDeliveryFee(parsedDelivery, kmLocal, cartSubtotal);
        return {
          deliveryFee: r.fee < 0 ? 0 : r.fee,
          waivedFree: r.waivedFreeShipping,
          namedLabel: null,
          quotedRouteKm:
            haversineKmVal != null
              ? haversineKmVal
              : Number.isFinite(manualKmParsed)
                ? manualKmParsed
                : null,
          outOfZone: r.fee === -1,
          quoteLoading: false,
          quoteError: null,
        };
      }, [
        store.fulfillment,
        store.deliveryNamedAreaId,
        parsedDelivery,
        pricingMode,
        cartSubtotal,
        selectedBranchId,
        addrQuote,
        addrLoading,
        addrError,
        distQuote,
        distError,
        haversineKmVal,
        manualKmParsed,
        store.deliveryLat,
        store.deliveryLng,
      ]);

    const grandTotal = Math.round(cartSubtotal + deliveryFee);

    const totalItems = useMemo(() => {
      if (!Array.isArray(store.cart)) return 0;
      return store.cart.reduce((acc, item) => {
        if (typeof item.quantity !== "number" || item.quantity < 1) return acc;
        return acc + item.quantity;
      }, 0);
    }, [store.cart]);

    const generateWhatsAppMessage = useCallback(() => {
      if (!Array.isArray(store.cart) || store.cart.length === 0) return "";

      let message = "*NUEVO PEDIDO WEB - CLIENTE*\n";
      message += "================================\n\n";

      store.cart.forEach((item) => {
        const price = getPrice(item);
        const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
        const name = typeof item.name === "string" ? item.name : "Producto";
        const subtotal = price * qty;
        message += `+ ${qty} x ${name.toUpperCase()}\n`;
        if (typeof item.description === "string" && item.description.trim()) {
          message += `   (Hacer: ${item.description})\n`;
        }
        message += `   Subtotal: $${formatCartMoney(subtotal)}\n`;
        message += "--------------------------------\n";
      });

      if (store.fulfillment === "delivery" && deliveryFee > 0) {
        message += `\nEnvio: $${formatCartMoney(deliveryFee)}\n`;
      }
      message += `\n*TOTAL A PAGAR: $${formatCartMoney(grandTotal)}*\n`;
      message += "================================\n";

      if (typeof store.orderNote === "string" && store.orderNote.trim()) {
        message += "\nNOTA DE COCINA:\n";
        message += `${store.orderNote}\n`;
      }

      return encodeURIComponent(message);
    }, [store.cart, store.orderNote, store.fulfillment, grandTotal, deliveryFee, getPrice]);

    const contextValue = useMemo(() => ({
      cart: isHydrated && Array.isArray(store.cart) ? store.cart : [],
      isCartOpen: !!store.isCartOpen,
      toggleCart: typeof store.toggleCart === "function" ? store.toggleCart : () => {},
      addToCart: typeof store.addToCart === "function" ? store.addToCart : () => {},
      decreaseQuantity: typeof store.decreaseQuantity === "function" ? store.decreaseQuantity : () => {},
      removeFromCart: typeof store.removeFromCart === "function" ? store.removeFromCart : () => {},
      clearCart: typeof store.clearCart === "function" ? store.clearCart : () => {},
      orderNote: typeof store.orderNote === "string" ? store.orderNote : "",
      setOrderNote: typeof store.setOrderNote === "function" ? store.setOrderNote : () => {},
      cartTotal: isHydrated ? cartTotal : 0,
      cartSubtotal: isHydrated ? cartSubtotal : 0,
      grandTotal: isHydrated ? grandTotal : 0,
      deliveryFee: isHydrated ? deliveryFee : 0,
      totalItems: isHydrated ? totalItems : 0,
      getPrice,
      generateWhatsAppMessage,
      fulfillment: store.fulfillment,
      setFulfillment: typeof store.setFulfillment === "function" ? store.setFulfillment : () => {},
      deliveryLine1: store.deliveryLine1,
      setDeliveryLine1: typeof store.setDeliveryLine1 === "function" ? store.setDeliveryLine1 : () => {},
      deliveryCommune: store.deliveryCommune,
      setDeliveryCommune: typeof store.setDeliveryCommune === "function" ? store.setDeliveryCommune : () => {},
      deliveryReference: store.deliveryReference,
      setDeliveryReference: typeof store.setDeliveryReference === "function" ? store.setDeliveryReference : () => {},
      deliveryLat: store.deliveryLat,
      deliveryLng: store.deliveryLng,
      setDeliveryCoords: typeof store.setDeliveryCoords === "function" ? store.setDeliveryCoords : () => {},
      deliveryNamedAreaId: store.deliveryNamedAreaId,
      setDeliveryNamedAreaId: typeof store.setDeliveryNamedAreaId === "function" ? store.setDeliveryNamedAreaId : () => {},
      deliveryKmManual: store.deliveryKmManual,
      setDeliveryKmManual: typeof store.setDeliveryKmManual === "function" ? store.setDeliveryKmManual : () => {},
      showDeliveryReference: store.showDeliveryReference,
      setShowDeliveryReference: typeof store.setShowDeliveryReference === "function" ? store.setShowDeliveryReference : () => {},
      deliveryWaivedFree: isHydrated ? waivedFree : false,
      deliveryNamedAreaLabel: isHydrated ? namedLabel : null,
      deliveryQuoteLoading: isHydrated ? quoteLoading : false,
      deliveryQuoteError: isHydrated ? quoteError : null,
      isDeliveryOutOfZone: isHydrated ? outOfZone : false,
      quotedRouteKm: isHydrated ? quotedRouteKm : null,
    }), [
      store,
      isHydrated,
      cartTotal,
      cartSubtotal,
      grandTotal,
      deliveryFee,
      totalItems,
      getPrice,
      generateWhatsAppMessage,
      waivedFree,
      namedLabel,
      quoteLoading,
      quoteError,
      outOfZone,
      quotedRouteKm,
    ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
