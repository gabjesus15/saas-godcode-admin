"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { useAntiZoom } from "../tenant/use-anti-zoom";
import { useAdminRole } from "./admin-role-context";
import { Sidebar } from "./sidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const { readOnly } = useAdminRole();
  useAntiZoom();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#09090b_50%,_#111827_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 md:flex-row lg:px-8">
        <aside className="hidden w-64 shrink-0 self-start rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 md:sticky md:top-6 md:block md:rounded-3xl md:p-6">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-6">
          <header className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-3 py-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 sm:rounded-3xl sm:px-5 sm:py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Control Center
              </p>
              <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                Panel Super Admin
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="h-10 w-24 shrink-0 md:hidden" aria-hidden />
              <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden">
            {readOnly ? (
              <div
                className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                role="status"
              >
                Modo soporte: solo lectura. No puedes crear ni modificar datos desde este rol.
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              className="absolute left-0 top-0 h-full w-[min(100vw-3rem,320px)] max-w-[85vw] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-zinc-900 sm:w-72 sm:p-6"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Navegación
                </span>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 dark:text-zinc-200"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Sidebar />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
