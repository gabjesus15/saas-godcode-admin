"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "./use-cart";
import "../../app/[subdomain]/styles/CartFloat.css";

export function CartFloat() {
  const { totalItems, cartTotal, toggleCart } = useCart();
  const hasItems = totalItems > 0;
  const [isIdle, setIsIdle] = useState(false);
  const prevCountRef = useRef(totalItems);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (totalItems > prevCountRef.current) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    prevCountRef.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    const resetTimer = () => {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (totalItems > 0) {
        timerRef.current = setTimeout(() => setIsIdle(true), 10000);
      }
    };
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [totalItems]);

  return (
    <button
      onClick={toggleCart}
      className={`cart-float ${hasItems ? "has-items" : ""} ${isIdle && hasItems ? "pulse-urgent" : ""}`}
    >
      <div className="cart-icon-wrapper">
        <ShoppingBag size={24} strokeWidth={2.5} />
        {hasItems ? <span className="cart-float-badge">{totalItems}</span> : null}
      </div>
      <div className="cart-label-container">
        <span className="cart-label-text">
          {hasItems ? (
            <>
              <span style={{ opacity: 0.8, fontWeight: 400 }}>Total:</span> ${cartTotal.toLocaleString("es-CL")}
            </>
          ) : (
            "Tu Bandeja"
          )}
        </span>
        <ArrowRight size={16} className="cart-arrow" />
      </div>
    </button>
  );
}
