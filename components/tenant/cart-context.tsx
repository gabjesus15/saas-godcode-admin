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
  /** Zona por nombre (modo manual). */
  deliveryNamedAreaId: string | null;
  setDeliveryNamedAreaId: (id: string | null) => void;
  /** Km manual si no hay GPS (modo distancia). */
  deliveryKmManual: string;
  setDeliveryKmManual: (value: string) => void;
  showDeliveryReference: boolean;
  setShowDeliveryReference: (value: boolean) => void;
  /** Envío gratis por subtotal (reglas del local). */
  deliveryWaivedFree: boolean;
  /** Etiqueta de zona resuelta (dirección automática). */
  deliveryNamedAreaLabel: string | null;
  /** Cotización en curso o error de API. */
  deliveryQuoteLoading: boolean;
  deliveryQuoteError: string | null;
  /** Delivery activo y km excede máximo o fuera de zona. */
  isDeliveryOutOfZone: boolean;
  /** Km en línea recta cliente–local o último km cotizado en servidor. */
  quotedRouteKm: number | null;
}

const CartContext = createContext<CartContextType | null>(null);

export default CartContext;
