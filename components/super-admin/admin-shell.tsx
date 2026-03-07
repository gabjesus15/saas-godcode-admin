"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Sidebar } from "./sidebar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#09090b_50%,_#111827_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 self-start rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 md:sticky md:top-6 md:block">
          <Sidebar />
        </aside>

        <div className="flex w-full flex-1 flex-col gap-6">
          <header className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Control Center
              </p>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Panel Super Admin
              </h1>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1">{children}</main>
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
              className="absolute left-0 top-0 h-full w-72 bg-white p-6 shadow-2xl dark:bg-zinc-900"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Navegacion
                </span>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 dark:text-zinc-200"
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
