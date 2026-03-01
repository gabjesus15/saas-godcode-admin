"use client";

import { useEffect, useMemo, useState } from "react";
import CartContext from "./cart-context";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { filterValidProductIds, isValidBranchId } from "./utils/safe-ids";

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

function ensureCartArray(value: unknown): CartItem[] {
  return Array.isArray(value) ? (value as CartItem[]) : [];
}

export function CartProvider({
  children,
  selectedBranchId,
}: {
  children: React.ReactNode;
  selectedBranchId?: string | null;
}) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("tenant_cart");
      const parsed = saved ? JSON.parse(saved) : [];
      return ensureCartArray(parsed);
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    if (!selectedBranchId) return;

    try {
      const storedBranchId = localStorage.getItem("tenant_cart_branch_id");
      if (storedBranchId && storedBranchId !== selectedBranchId && cart.length > 0) {
        setCart([]);
        setOrderNote("");
        localStorage.setItem("tenant_cart", "[]");
      }
      localStorage.setItem("tenant_cart_branch_id", selectedBranchId);
    } catch {
      return;
    }
  }, [selectedBranchId]);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const cartProductIds = useMemo(
    () =>
      Array.isArray(cart)
        ? Array.from(new Set(cart.map((item) => String(item.id || "")).filter(Boolean))).join(",")
        : "",
    [cart]
  );

  useEffect(() => {
    if (!cartProductIds || !selectedBranchId) return;
    if (!isValidBranchId(selectedBranchId)) return;

    let cancelled = false;

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

        if (cancelled) return;
        if (error) {
          return;
        }

        setCart((prevCart) => {
          const priceByProductId = new Map(
            (data ?? []).map((row) => [String(row.product_id), row])
          );
          const hasAnyRows = (data ?? []).length > 0;

          const next = prevCart.reduce<CartItem[]>((acc, cartItem) => {
              const priceRow = priceByProductId.get(String(cartItem.id)) ?? null;
              const meta = (priceRow as any)?.products;

              if (priceRow) {
                acc.push({
                  ...cartItem,
                  price: priceRow.price,
                  has_discount: priceRow.has_discount,
                  discount_price: priceRow.discount_price,
                  name: meta?.name ?? cartItem.name,
                  is_active: meta?.is_active ?? cartItem.is_active,
                  description: meta?.description ?? cartItem.description,
                });
                return acc;
              }

              if (!hasAnyRows) {
                acc.push(cartItem);
              }

              return acc;
            }, [])
            .filter((item) => item.is_active !== false);

          const sameLength = prevCart.length === next.length;
          const isSame =
            sameLength &&
            prevCart.every((prevItem, index) => {
              const nextItem = next[index];
              return (
                nextItem &&
                prevItem.id === nextItem.id &&
                prevItem.quantity === nextItem.quantity &&
                Number(prevItem.price ?? 0) === Number(nextItem.price ?? 0) &&
                Boolean(prevItem.has_discount) === Boolean(nextItem.has_discount) &&
                Number(prevItem.discount_price ?? 0) === Number(nextItem.discount_price ?? 0) &&
                prevItem.is_active === nextItem.is_active &&
                (prevItem.name ?? "") === (nextItem.name ?? "") &&
                (prevItem.description ?? "") === (nextItem.description ?? "")
              );
            });

          if (isSame) return prevCart;
          return next;
        });
      } catch {
        if (!cancelled) {
          return;
        }
      }
    };

    validatePrices();
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId, cartProductIds, supabase]);

  useEffect(() => {
    localStorage.setItem("tenant_cart", JSON.stringify(cart));
  }, [cart]);

  const getPrice = (product: CartItem) => {
    if (product.has_discount && product.discount_price != null && Number(product.discount_price) > 0) {
      return Number(product.discount_price);
    }
    return Number(product.price) || 0;
  };

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (product: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= 20) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNote("");
  };

  const cartTotal = cart.reduce((acc, item) => acc + getPrice(item) * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const generateWhatsAppMessage = () => {
    if (cart.length === 0) return "";

    let message = "";
    message += "*NUEVO PEDIDO WEB - CLIENTE*\n";
    message += "================================\n\n";

    cart.forEach((item) => {
      const price = getPrice(item);
      const subtotal = price * item.quantity;
      message += `+ ${item.quantity} x ${(item.name ?? "").toUpperCase()}\n`;
      if (item.description) {
        message += `   (Hacer: ${item.description})\n`;
      }
      message += `   Subtotal: $${subtotal.toLocaleString("es-CL")}\n`;
      message += "--------------------------------\n";
    });

    message += `\n*TOTAL A PAGAR: $${cartTotal.toLocaleString("es-CL")}*\n`;
    message += "================================\n";

    if (orderNote.trim()) {
      message += "\nNOTA DE COCINA:\n";
      message += `${orderNote}\n`;
    }

    return encodeURIComponent(message);
  };

  const value = useMemo(
    () => ({
      cart,
      isCartOpen,
      toggleCart,
      addToCart,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      totalItems,
      getPrice,
      orderNote,
      setOrderNote,
      generateWhatsAppMessage,
    }),
    [
      cart,
      isCartOpen,
      cartTotal,
      totalItems,
      orderNote,
      getPrice,
      generateWhatsAppMessage,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
