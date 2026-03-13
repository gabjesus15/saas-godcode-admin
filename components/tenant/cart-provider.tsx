"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import CartContext from "./cart-context";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { filterValidProductIds, isValidBranchId } from "./utils/safe-ids";

// --- TIPOS ---
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

// --- ZUSTAND STORE DEFINITION ---
// Definimos el estado y las acciones en un store atómico
interface CartState {
  cart: CartItem[];
  isCartOpen: boolean;
  orderNote: string;
  storedBranchId?: string | null; // Guardamos el branchId en el store para validar persistencia
  // Acciones
  toggleCart?: () => void;
  addToCart?: (product: CartProduct) => void;
  decreaseQuantity?: (productId: string) => void;
  removeFromCart?: (id: string) => void;
  clearCart?: () => void;
  setOrderNote?: (note: string) => void;
  setCart?: (cart: CartItem[]) => void;
  setStoredBranchId?: (id: string | null) => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isCartOpen: false,
      orderNote: "",
      storedBranchId: null,

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      addToCart: (product) => set((state) => {
        const existing = state.cart.find((item) => item.id === product.id);
        if (existing) {
          if (existing.quantity >= 20) return {}; // Límite de cantidad (retornar objeto vacío para no cambiar estado)
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 } as CartItem] };
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

      clearCart: () => set({ cart: [], orderNote: "" }),

      setOrderNote: (note) => set({ orderNote: note }),

      setCart: (newCart) => set({ cart: newCart }),
      
      setStoredBranchId: (id) => set({ storedBranchId: id }),
    }),
    {
      name: "tenant_cart_storage", // Nombre único para localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos lo necesario
      partialize: (state) => ({ 
        cart: state.cart, 
        orderNote: state.orderNote, 
        storedBranchId: state.storedBranchId 
      }),
    }
  )
);

// --- PROVIDER COMPONENT ---
// Mantenemos el Provider para compatibilidad con el resto de la app y para manejar
// la lógica de validación de precios (side-effects) que requiere props del servidor.
export function CartProvider({
  children,
  selectedBranchId,
}: {
  children: React.ReactNode;
  selectedBranchId?: string | null;
}) {
    // Conectamos con el store
    const store = useCartStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const supabase = useMemo(() => createSupabaseBrowserClient("tenant"), []);

    // Manejo de Hidratación (Evita errores de SSR en Next.js)
    useEffect(() => {
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => setIsHydrated(true));
      }
    }, []);

    // Sincronizar branch guardado con branch actual al hidratar
    useEffect(() => {
      if (!isHydrated) return;
      const { setStoredBranchId, clearCart, storedBranchId } = useCartStore.getState();
      if (!selectedBranchId) {
        if (storedBranchId !== null) {
          if (typeof setStoredBranchId === "function") setStoredBranchId(null);
          if (typeof clearCart === "function") clearCart();
        }
        return;
      }
      if (storedBranchId !== selectedBranchId) {
        if (typeof setStoredBranchId === "function") setStoredBranchId(selectedBranchId);
        if (typeof clearCart === "function") clearCart();
      }
    }, [isHydrated, selectedBranchId]);

  // Lógica de Validación de Precios en tiempo real (Base de datos)
  // Se mantiene similar pero actualiza el store directamente
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

        const priceByProductId = new Map(
            (data || []).map((row: PriceRow) => {
              const typedRow: PriceRow = {
                product_id: String(row.product_id),
                price: Number(row.price),
                has_discount: Boolean(row.has_discount),
                discount_price: Number(row.discount_price),
                products: row.products ? {
                  id: String(row.products.id),
                  name: row.products.name ?? null,
                  is_active: row.products.is_active ?? null,
                  description: row.products.description ?? null,
                } : undefined
              };
              return [typedRow.product_id, typedRow];
            })
        );
        const hasAnyRows = (data || []).length > 0;

                  const {} = useCartStore.getState(); // Eliminar variables no usadas
        const currentCart = useCartStore.getState().cart;
        const nextCart = currentCart.reduce<CartItem[]>((acc, cartItem) => {
          const priceRow = priceByProductId.get(String(cartItem.id)) as PriceRow | undefined;
          if (priceRow) {
            const meta = priceRow.products;
            acc.push({
              ...cartItem,
              price: priceRow.price,
              has_discount: priceRow.has_discount,
              discount_price: priceRow.discount_price,
              name: meta?.name ?? cartItem.name,
              is_active: meta?.is_active ?? cartItem.is_active,
              description: meta?.description ?? cartItem.description,
            });
          } else if (!hasAnyRows) {
            acc.push(cartItem);
          }
          return acc;
        }, []).filter(item => item.is_active !== false);

        const isSame = JSON.stringify(currentCart) === JSON.stringify(nextCart);
        if (!isSame) {
            if (typeof store.setCart === "function") store.setCart(nextCart);
        }

      } catch (err) {
        console.error("Error validando precios:", err);
      }
    };

    validatePrices();
    return () => { cancelled = true; };
  }, [selectedBranchId, cartProductIds, supabase, isHydrated, store]);

  // Helper de precio
  const getPrice = useCallback((product: CartProduct | CartItem) => {
    // Validación robusta de tipos y valores
    if (typeof product !== "object" || product == null) return 0;
    if (product.has_discount && typeof product.discount_price === "number" && product.discount_price > 0) {
      return product.discount_price;
    }
    if (typeof product.price === "number") return product.price;
    return 0;
  }, []);

  // Helper de WhatsApp
  const cartTotal = useMemo(() => {
    if (!Array.isArray(store.cart)) return 0;
    return store.cart.reduce((acc, item) => {
      const price = getPrice(item);
      if (typeof item.quantity !== "number" || item.quantity < 1) return acc;
      return acc + price * item.quantity;
    }, 0);
  }, [store.cart, getPrice]);

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
      message += `   Subtotal: $${subtotal.toLocaleString("es-CL")}\n`;
      message += "--------------------------------\n";
    });

    message += `\n*TOTAL A PAGAR: $${cartTotal.toLocaleString("es-CL")}*\n`;
    message += "================================\n";

    if (typeof store.orderNote === "string" && store.orderNote.trim()) {
      message += "\nNOTA DE COCINA:\n";
      message += `${store.orderNote}\n`;
    }

    return encodeURIComponent(message);
  }, [store.cart, store.orderNote, cartTotal, getPrice]);

  // Adaptador de Contexto para mantener compatibilidad
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
    totalItems: isHydrated ? totalItems : 0,
    getPrice,
    generateWhatsAppMessage,
  }), [store, isHydrated, cartTotal, totalItems, getPrice, generateWhatsAppMessage]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
