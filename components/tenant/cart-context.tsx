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

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  toggleCart: () => void;
  addToCart: (product: CartProduct) => void;
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  totalItems: number;
  getPrice: (product: CartProduct) => number;
  orderNote: string;
  setOrderNote: (note: string) => void;
  generateWhatsAppMessage: () => string;
}

const CartContext = createContext<CartContextType | null>(null);

export default CartContext;
