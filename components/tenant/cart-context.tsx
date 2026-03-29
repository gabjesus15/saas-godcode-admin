"use client";

import { createContext } from "react";

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

interface CartItem extends CartProduct {
  quantity: number;
}

export type CartFulfillment = "pickup" | "delivery";

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  toggleCart: () => void;
  addToCart: (product: CartProduct) => void;
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  /** Productos solamente (sin envío). */
  cartSubtotal: number;
  /** Subtotal + envío si aplica delivery activo. */
  grandTotal: number;
  deliveryFee: number;
  totalItems: number;
  getPrice: (product: CartProduct) => number;
  orderNote: string;
  setOrderNote: (note: string) => void;
  generateWhatsAppMessage: () => string;
  fulfillment: CartFulfillment;
  setFulfillment: (value: CartFulfillment) => void;
  deliveryLine1: string;
  setDeliveryLine1: (value: string) => void;
  deliveryCommune: string;
  setDeliveryCommune: (value: string) => void;
  deliveryReference: string;
  setDeliveryReference: (value: string) => void;
  deliveryLat: number | null;
  deliveryLng: number | null;
  setDeliveryCoords: (lat: number | null, lng: number | null) => void;
  /** Delivery activo y km excede max_delivery_km. */
  isDeliveryOutOfZone: boolean;
  /** Km usados para cotizar (haversine si hay GPS + origen; si no, 0). */
  quotedRouteKm: number | null;
}

const CartContext = createContext<CartContextType | null>(null);

export default CartContext;
