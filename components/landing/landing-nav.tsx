"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { LandingLogo } from "./landing-logo";

const navLinks = [
  { href: "#funciones", label: "Funciones" },
  { href: "#producto", label: "Producto" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacto", label: "Contacto" },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <header
        suppressHydrationWarning
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 ${
          scrolled
            ? "border-b border-slate-200/70 bg-white/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/80"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a
            href="#inicio"
            className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <LandingLogo />
          </a>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
            >
              Crear cuenta
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/onboarding"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white dark:bg-white dark:text-slate-900"
            >
              Crear cuenta
            </Link>

            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
              >
                {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
              </button>
            </DialogPrimitive.Trigger>
          </div>
        </div>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay asChild>
            <motion.div
              className="fixed inset-0 top-16 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
          </DialogPrimitive.Overlay>

          <DialogPrimitive.Content asChild>
            <motion.nav
              className="fixed right-0 top-16 z-50 flex h-[calc(100dvh-4rem)] w-full max-w-xs flex-col overflow-y-auto border-l border-slate-200/60 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              aria-label="Navegación móvil"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-0.5">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2.5 text-center text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 text-center text-[14px] font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                  onClick={() => setOpen(false)}
                >
                  Crear cuenta
                </Link>
              </div>
            </motion.nav>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </header>
    </DialogPrimitive.Root>
  );
}
