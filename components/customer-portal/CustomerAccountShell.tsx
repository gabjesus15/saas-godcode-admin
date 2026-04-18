"use client";

import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SaasLogo } from "@/components/super-admin/SaasLogo";

import {
  PORTAL_TAB_ICONS,
  PORTAL_TAB_LABELS,
  PORTAL_TAB_ORDER,
} from "./customer-account-constants";
import type { PortalTab } from "./customer-account-types";

export type CustomerAccountShellProps = {
  companyName: string;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  subscriptionStatusLabel: string;
  lastRealtimeSyncAt: string | null;
  formatSyncTime: (iso: string | null | undefined) => string;
  children: React.ReactNode;
};

export function CustomerAccountShell({
  companyName,
  activeTab,
  onTabChange,
  subscriptionStatusLabel,
  lastRealtimeSyncAt,
  formatSyncTime,
  children,
}: CustomerAccountShellProps) {
  const syncLine = lastRealtimeSyncAt
    ? `Último sync ${formatSyncTime(lastRealtimeSyncAt)}`
    : "Sincronizando…";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#09090b_50%,_#111827_100%)] transition-colors duration-500">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-3 py-5 sm:px-4 md:flex-row md:gap-8 lg:px-8">
        <aside className="hidden w-64 shrink-0 self-start rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none md:sticky md:top-6 md:block">
          <div className="mb-6 border-b border-zinc-100/80 pb-6 dark:border-zinc-800/80">
            <SaasLogo />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
              Portal de cuenta
            </p>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Secciones del portal">
            {PORTAL_TAB_ORDER.map((key) => {
              const Icon = PORTAL_TAB_ICONS[key];
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTabChange(key)}
                  className={`group relative flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all duration-300 ${
                    active
                      ? "bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-500/25 dark:bg-indigo-500"
                      : "font-medium text-zinc-600 hover:bg-white hover:shadow-md hover:shadow-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200 dark:hover:shadow-none"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? "text-white" : "text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`}
                    aria-hidden
                  />
                  <span className="truncate">{PORTAL_TAB_LABELS[key]}</span>
                  {active && (
                    <motion.span
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 rounded-2xl bg-indigo-600 -z-10 dark:bg-indigo-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-zinc-100/80 pt-6 dark:border-zinc-800/80">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="group flex w-full min-w-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden />
                <span className="truncate">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-3xl border border-zinc-200/80 bg-white/70 px-6 py-5 shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70 dark:shadow-none sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-zinc-400 sm:text-2xl">
                  {companyName}
                </h1>
                <div className="mt-1.5 flex items-center gap-2 md:hidden">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    {PORTAL_TAB_LABELS[activeTab]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden h-10 w-px bg-zinc-200/80 dark:bg-zinc-800/80 sm:block" />
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${subscriptionStatusLabel.toLowerCase().includes('activo') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{subscriptionStatusLabel}</span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-500" title={syncLine}>
                    {syncLine}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 md:hidden">
              <select
                id="portal-section-mobile"
                value={activeTab}
                onChange={(e) => onTabChange(e.target.value as PortalTab)}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white/50 px-4 text-sm font-semibold text-zinc-900 shadow-sm outline-none ring-indigo-500/20 transition-all focus:border-indigo-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100"
              >
                {PORTAL_TAB_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {PORTAL_TAB_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden pb-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

