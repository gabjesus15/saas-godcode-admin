"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useCart } from "./use-cart";
import { getCloudinaryOptimizedUrl } from "./utils/cloudinary";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(Number(price) || 0);
};

interface ProductCardProps {
  product: {
    id: string;
    name: string | null;
    description: string | null;
    image_url: string | null;
    price: number;
    has_discount: boolean;
    discount_price: number | null;
    is_special: boolean;
  };
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, priority = false }: ProductCardProps) {
  const { cart, addToCart, decreaseQuantity } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    if (!imageLoaded) {
      const timeout = setTimeout(() => setImageLoaded(true), 5000);
      return () => clearTimeout(timeout);
    }
  }, [imageLoaded]);
  const [isBumping, setIsBumping] = useState(false);

  const cartItem = useMemo(
    () => cart.find((item: { id: string }) => item.id === product.id),
    [cart, product.id]
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  const isLongDesc = (product.description || "").length > 60;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isExpanded) {
      timer = setTimeout(() => setIsExpanded(false), 15000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isExpanded]);

  const handleAdd = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      addToCart(product);
      setIsBumping(true);
      setTimeout(() => setIsBumping(false), 200);
    },
    [addToCart, product]
  );

  const handleDecrease = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      decreaseQuantity(product.id);
    },
    [decreaseQuantity, product.id]
  );

  const toggleExpand = useCallback(() => {
    if (isLongDesc) setIsExpanded((prev) => !prev);
  }, [isLongDesc]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpand();
    }
  };

  const resolvedImageUrl = getCloudinaryOptimizedUrl(product.image_url, {
    width: 600,
    height: 450,
    crop: "fill",
    gravity: "auto",
  });
  const initialImageUrl = resolvedImageUrl || FALLBACK_IMAGE;

  return (
    <div
      className={`product-card glass ${isExpanded ? "is-viewing-info" : ""} ${
        !isLongDesc ? "cursor-default" : "cursor-pointer"
      }`}
      onClick={toggleExpand}
      onKeyDown={isLongDesc ? handleKeyDown : undefined}
    >
      <div className={`product-image ${isBumping ? "bump-active" : ""}`}>
        {!imageLoaded ? <div className="skeleton-loader absolute inset-0" /> : null}
        <Image
          src={initialImageUrl}
          alt={product.name ?? "Producto"}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={priority}
          unoptimized
          onLoad={() => setImageLoaded(true)}
          className={!imageLoaded ? "opacity-0" : "opacity-100 transition-opacity duration-500"}
          onError={() => setImageLoaded(true)}
        />

        {product.is_special ? <span className="badge-special">ESPECIAL</span> : null}
        {product.has_discount ? <span className="badge-discount">OFERTA</span> : null}

        {quantity > 0 ? (
          <div className="qty-badge-overlay animate-bounce-in">{quantity}</div>
        ) : null}
      </div>

      <div className="product-info">
        <div className="info-content-wrapper">
          {!isExpanded ? (
            <>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-desc-clamped">{product.description}</p>
            </>
          ) : (
            <div
              className="product-desc-scrollable animate-in-fade"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="desc-header">
                <span>Detalles</span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="btn-icon-sm"
                  aria-label="Cerrar detalles"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="scroll-area">
                <p>{product.description}</p>
              </div>
            </div>
          )}
        </div>

        {isLongDesc && !isExpanded ? (
          <div className="info-hint">
            <ChevronDown size={14} /> Ver detalles
          </div>
        ) : null}

        <div className="product-footer">
          <div className={`price-container ${product.has_discount ? "has-discount" : ""}`}>
            {product.has_discount && product.discount_price ? (
              <>
                <span className="product-price discounted">
                  {formatPrice(product.discount_price)}
                </span>
                <span className="product-price original">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="product-price">{formatPrice(product.price)}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="btn-add"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <Plus size={18} />
              <span>Agregar</span>
            </button>
          ) : (
            <div className="stepper-control animate-fade" onClick={(event) => event.stopPropagation()}>
              <button onClick={handleDecrease} className="step-btn minus" aria-label="Disminuir cantidad">
                <Minus size={16} />
              </button>
              <span className="step-count">{quantity}</span>
              <button onClick={handleAdd} className="step-btn plus" aria-label="Aumentar cantidad">
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
