"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { landingPhoneCarouselSlides } from "../../lib/landing-media";
import { cn } from "../../utils/cn";
import { PhoneFrame } from "./landing-device-frame";

const slides = landingPhoneCarouselSlides;

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

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((i) => (i - 1 + slides.length) % slides.length);
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

  /** Evita que el padre haga setPointerCapture y rompa el clic en las flechas */
  const stopCarouselPointerBubble = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation();
  }, []);

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
        <button
          type="button"
          onClick={prev}
          onPointerDown={stopCarouselPointerBubble}
          onPointerUp={stopCarouselPointerBubble}
          onPointerCancel={stopCarouselPointerBubble}
          aria-label="Vista anterior"
          className="absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200/70 bg-white/90 p-0 text-slate-700 shadow-sm backdrop-blur ring-1 ring-slate-200/60 transition hover:bg-white hover:ring-slate-300/80 sm:inline-flex dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:text-zinc-100 dark:ring-zinc-800/60 dark:hover:bg-zinc-900/90"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={next}
          onPointerDown={stopCarouselPointerBubble}
          onPointerUp={stopCarouselPointerBubble}
          onPointerCancel={stopCarouselPointerBubble}
          aria-label="Vista siguiente"
          className="absolute right-0 top-1/2 z-20 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200/70 bg-white/90 p-0 text-slate-700 shadow-sm backdrop-blur ring-1 ring-slate-200/60 transition hover:bg-white hover:ring-slate-300/80 sm:inline-flex dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:text-zinc-100 dark:ring-zinc-800/60 dark:hover:bg-zinc-900/90"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>

        {/* Prev phone (left, smaller) */}
        <motion.div
          key={`prev-${prevIdx}`}
          className="pointer-events-none hidden -translate-x-4 opacity-40 blur-[1px] sm:block lg:-translate-x-8"
          initial={prefersReduced ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        >
          <PhoneFrame
            className="!max-w-[140px] lg:!max-w-[170px]"
            src={slides[prevIdx].src}
            alt={slides[prevIdx].label}
          />
        </motion.div>

        {/* Active phone (center): ancho fijo + wait evita el “salto” de popLayout con flex */}
        <div className="relative z-10 -mx-4 w-[min(100%,280px)] overflow-hidden sm:-mx-6 sm:w-[min(100%,300px)] lg:w-[min(100%,320px)]">
          <div className="relative mx-auto w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[270px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.id}
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
                <PhoneFrame
                  className="!max-w-none w-full"
                  src={current.src}
                  alt={current.label}
                />
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
          <PhoneFrame
            className="!max-w-[140px] lg:!max-w-[170px]"
            src={slides[nextIdx].src}
            alt={slides[nextIdx].label}
          />
        </motion.div>
      </div>

      {/* Label */}
      <div className="relative mx-auto mt-6 max-w-md overflow-hidden text-center sm:mt-8">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current.id}
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
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={s.label}
            className={cn(
              "h-2 cursor-pointer rounded-full transition-all duration-300",
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
