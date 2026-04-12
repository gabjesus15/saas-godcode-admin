"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { LandingSlide } from "../../lib/landing-media-types";
import { cn } from "../../utils/cn";
import { PhoneFrame } from "./landing-device-frame";

const AUTO_INTERVAL = 4000;
/** Mínimo horizontal (px) y que supere al vertical para contar como swipe */
const SWIPE_MIN_DX = 40;
const sidePhoneClassName = "w-[clamp(108px,10vw,140px)] lg:w-[clamp(120px,9vw,156px)]";
const centerPhoneClassName = "w-[clamp(198px,54vw,240px)] sm:w-[clamp(214px,20vw,252px)] lg:w-[clamp(236px,16vw,272px)]";

export function LandingPhoneCarousel({ slides }: { slides: LandingSlide[] }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const prefersReduced = useReducedMotion();
  const activeRef = useRef(active);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const transitionLockRef = useRef(false);
  const queuedTargetRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const normalizeIndex = useCallback((i: number) => {
    const len = slides.length;
    if (len === 0) return 0;
    return ((i % len) + len) % len;
  }, [slides.length]);

  const getDirectionToTarget = useCallback((from: number, to: number) => {
    const len = slides.length;
    if (len === 0) return 0;
    const forward = (to - from + len) % len;
    const backward = (from - to + len) % len;
    if (forward === 0) return 0;
    return forward <= backward ? 1 : -1;
  }, [slides.length]);

  const runTransition = useCallback(
    (targetIndex: number) => {
      const applyTransition = (idx: number) => {
        const currentIdx = activeRef.current;
        if (idx === currentIdx) return;
        const nextDirection = getDirectionToTarget(currentIdx, idx);
        setDirection(nextDirection);
        setActive(idx);
        activeRef.current = idx;
      };

      const nextIdx = normalizeIndex(targetIndex);
      applyTransition(nextIdx);

      if (prefersReduced) return;

      transitionLockRef.current = true;
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
      unlockTimerRef.current = window.setTimeout(() => {
        transitionLockRef.current = false;
        const queuedTarget = queuedTargetRef.current;
        queuedTargetRef.current = null;
        if (queuedTarget !== null && queuedTarget !== activeRef.current) {
          applyTransition(normalizeIndex(queuedTarget));
        }
      }, 360);
    },
    [getDirectionToTarget, normalizeIndex, prefersReduced],
  );

  const requestTransition = useCallback(
    (targetIndex: number) => {
      const nextIdx = normalizeIndex(targetIndex);
      if (!prefersReduced && transitionLockRef.current) {
        queuedTargetRef.current = nextIdx;
        return;
      }
      runTransition(nextIdx);
    },
    [normalizeIndex, prefersReduced, runTransition],
  );

  const goTo = useCallback((i: number) => {
    requestTransition(i);
  }, [requestTransition]);

  const next = useCallback(() => {
    requestTransition(activeRef.current + 1);
  }, [requestTransition]);

  const prev = useCallback(() => {
    requestTransition(activeRef.current - 1);
  }, [requestTransition]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paused || prefersReduced) return;
    if (slides.length <= 1) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, next, prefersReduced, slides.length]);

  const hasSlides = slides.length > 0;
  const safeActive = hasSlides ? normalizeIndex(active) : 0;
  const current = hasSlides ? slides[safeActive] : null;
  const prevIdx = hasSlides ? (safeActive - 1 + slides.length) % slides.length : 0;
  const nextIdx = hasSlides ? (safeActive + 1) % slides.length : 0;

  const slideTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

  const textTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

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

      const cur = activeRef.current;
      if (dx < 0) goTo(cur + 1);
      else goTo(cur - 1);
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

  if (!hasSlides || current === null) return null;

  return (
    <div
      className="relative mt-6 w-screen max-w-none -ml-[calc(50vw-50%)] sm:mx-auto sm:mt-16 sm:w-auto sm:max-w-7xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Vistas del producto en el móvil"
        className="touch-pan-y flex min-h-[62dvh] cursor-grab flex-col px-2 active:cursor-grabbing sm:min-h-0 sm:px-0"
        onPointerDown={onSwipePointerDown}
        onPointerUp={onSwipePointerUp}
        onPointerCancel={onSwipePointerCancel}
      >
        {/* Phones */}
        <div className="relative flex flex-1 items-center justify-center gap-2 py-2 sm:gap-4 sm:py-6 lg:gap-6 lg:py-8">
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

          <motion.div
            key={`prev-${prevIdx}`}
            className="pointer-events-none hidden shrink-0 opacity-70 sm:block"
            initial={prefersReduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 0.75, x: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <PhoneFrame
              className={cn(sidePhoneClassName, "!w-full !max-w-none")}
              imageClassName="grayscale-[0.95] blur-[0.7px] contrast-90"
              src={slides[prevIdx].src}
              alt={slides[prevIdx].label}
            />
          </motion.div>

          <div className="relative z-10 flex min-w-0 flex-none justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={current.id}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: prefersReduced ? 0 : dir > 0 ? 28 : -28,
                    opacity: 0,
                  }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({
                    x: prefersReduced ? 0 : dir > 0 ? -28 : 28,
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className={cn("pointer-events-none mx-auto shrink-0", centerPhoneClassName)}
              >
                <PhoneFrame
                  className="!w-full !max-w-none"
                  src={current.src}
                  alt={current.label}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            key={`next-${nextIdx}`}
            className="pointer-events-none hidden shrink-0 opacity-70 sm:block"
            initial={prefersReduced ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 0.75, x: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <PhoneFrame
              className={cn(sidePhoneClassName, "!w-full !max-w-none")}
              imageClassName="grayscale-[0.95] blur-[0.7px] contrast-90"
              src={slides[nextIdx].src}
              alt={slides[nextIdx].label}
            />
          </motion.div>
        </div>

      {/* Label */}
      <div className="relative mx-auto mt-4 max-w-xl overflow-hidden px-3 text-center sm:mt-12 sm:px-0 lg:mt-14">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current.id}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                x: prefersReduced ? 0 : dir > 0 ? 22 : -22,
                opacity: 0,
              }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({
                x: prefersReduced ? 0 : dir > 0 ? -22 : 22,
                opacity: 0,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={textTransition}
          >
            <p className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">{current.label}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">{current.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-2 sm:mt-5">
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
