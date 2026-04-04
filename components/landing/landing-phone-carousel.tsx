"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "../../utils/cn";
import { PhoneFrame } from "./landing-device-frame";
import { ScreenPlaceholder } from "./landing-screen-placeholder";

type Slide = {
  variant: "menu-mobile" | "cart" | "orders" | "menu" | "dashboard" | "pos" | "inventory";
  label: string;
  sub: string;
};

const slides: Slide[] = [
  { variant: "menu-mobile", label: "Menú digital", sub: "Categorías, productos y banners desde el celular" },
  { variant: "cart", label: "Carrito y checkout", sub: "Resumen de pedido, extras y pago integrado" },
  { variant: "orders", label: "Panel de pedidos", sub: "Estados, progreso y notificaciones en vivo" },
  { variant: "pos", label: "Punto de venta", sub: "Cobra en tu local rápido y sin complicaciones" },
  { variant: "inventory", label: "Inventario", sub: "Stock por sucursal con alertas automáticas" },
];

const AUTO_INTERVAL = 4000;
/** Mínimo horizontal (px) y que supere al vertical para contar como swipe */
const SWIPE_MIN_DX = 40;

export function LandingPhoneCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const prefersReduced = useReducedMotion();
  const activeRef = useRef(active);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  activeRef.current = active;

  const goTo = useCallback((i: number) => {
    const len = slides.length;
    const cur = activeRef.current;
    const nextForward = i === (cur + 1) % len;
    const nextBackward = i === (cur - 1 + len) % len;
    if (nextForward) setDirection(1);
    else if (nextBackward) setDirection(-1);
    else setDirection(i > cur ? 1 : -1);
    setActive(i);
  }, []);

  const next = useCallback(() => {
    setDirection(1);
    setActive((i) => (i + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (paused || prefersReduced) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, next, prefersReduced]);

  const current = slides[active];
  const prevIdx = (active - 1 + slides.length) % slides.length;
  const nextIdx = (active + 1) % slides.length;

  const slideTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.32, 0.72, 0, 1] as const };

  const onSwipePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    },
    [prefersReduced],
  );

  const clearSwipeCapture = useCallback((el: HTMLDivElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    swipeStartRef.current = null;
  }, []);

  const onSwipePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (prefersReduced) return;
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== e.pointerId) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      clearSwipeCapture(e.currentTarget, e.pointerId);

      if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < SWIPE_MIN_DX) return;

      const len = slides.length;
      const cur = activeRef.current;
      if (dx < 0) goTo((cur + 1) % len);
      else goTo((cur - 1 + len) % len);
    },
    [prefersReduced, goTo, clearSwipeCapture],
  );

  const onSwipePointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (start?.pointerId === e.pointerId) clearSwipeCapture(e.currentTarget, e.pointerId);
    },
    [clearSwipeCapture],
  );

  return (
    <div
      className="mt-12 sm:mt-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Vistas del producto en el móvil"
        className="touch-pan-y cursor-grab active:cursor-grabbing"
        onPointerDown={onSwipePointerDown}
        onPointerUp={onSwipePointerUp}
        onPointerCancel={onSwipePointerCancel}
      >
      {/* Phones */}
      <div className="relative flex items-center justify-center">
        {/* Prev phone (left, smaller) */}
        <motion.div
          key={`prev-${prevIdx}`}
          className="pointer-events-none hidden -translate-x-4 opacity-40 blur-[1px] sm:block lg:-translate-x-8"
          initial={prefersReduced ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        >
          <PhoneFrame className="!max-w-[140px] lg:!max-w-[170px]">
            <ScreenPlaceholder variant={slides[prevIdx].variant} />
          </PhoneFrame>
        </motion.div>

        {/* Active phone (center): ancho fijo + wait evita el “salto” de popLayout con flex */}
        <div className="relative z-10 -mx-4 w-[min(100%,280px)] overflow-hidden sm:-mx-6 sm:w-[min(100%,300px)] lg:w-[min(100%,320px)]">
          <div className="relative mx-auto w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[270px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.variant}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: prefersReduced ? 0 : dir > 0 ? "100%" : "-100%",
                    opacity: 0,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({
                    x: prefersReduced ? 0 : dir > 0 ? "-100%" : "100%",
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="w-full"
              >
                <PhoneFrame className="!max-w-none w-full">
                  <ScreenPlaceholder variant={current.variant} />
                </PhoneFrame>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Next phone (right, smaller) */}
        <motion.div
          key={`next-${nextIdx}`}
          className="pointer-events-none hidden translate-x-4 opacity-40 blur-[1px] sm:block lg:translate-x-8"
          initial={prefersReduced ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        >
          <PhoneFrame className="!max-w-[140px] lg:!max-w-[170px]">
            <ScreenPlaceholder variant={slides[nextIdx].variant} />
          </PhoneFrame>
        </motion.div>
      </div>

      {/* Label */}
      <div className="relative mx-auto mt-6 max-w-md overflow-hidden text-center sm:mt-8">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current.variant}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: prefersReduced ? 0 : dir > 0 ? "40%" : "-40%",
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({
                x: prefersReduced ? 0 : dir > 0 ? "-40%" : "40%",
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={prefersReduced ? { duration: 0 } : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">{current.label}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">{current.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.variant}
            type="button"
            onClick={() => goTo(i)}
            aria-label={s.label}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === active
                ? "w-6 bg-indigo-600 dark:bg-indigo-400"
                : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-zinc-700 dark:hover:bg-zinc-600",
            )}
          />
        ))}
      </div>
    </div>
  );
}
