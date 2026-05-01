"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SaasLogo } from "@/components/super-admin/SaasLogo";
import { Badge, subscriptionStatusVariant } from "./ui/Badge";
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
  subscriptionStatus: string | null;
  subscriptionStatusLabel: string;
  lastRealtimeSyncAt: string | null;
  /** true mientras la solicitud de snapshot está en vuelo. */
  isSyncing?: boolean;
  children: React.ReactNode;
};

export function CustomerAccountShell({
  companyName,
  activeTab,
  onTabChange,
  subscriptionStatus,
  subscriptionStatusLabel,
  lastRealtimeSyncAt,
  isSyncing = false,
  children,
}: CustomerAccountShellProps) {
  const badgeVariant = subscriptionStatusVariant(subscriptionStatus);

  const syncLabel = isSyncing
    ? "Sincronizando…"
    : lastRealtimeSyncAt
    ? `Sync ${new Date(lastRealtimeSyncAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`
    : "Sin datos de sync";

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-5 sm:px-4 md:flex-row md:gap-6 lg:px-8">

        {/* ── Sidebar desktop ── */}
        <aside className="hidden w-60 shrink-0 self-start md:sticky md:top-6 md:block">
          <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-sm">

            <div className="mb-5 border-b border-[#e5e5ea] pb-5">
              <SaasLogo />
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a1a1a6]">
                Portal de cuenta
              </p>
            </div>

            <nav className="flex flex-col gap-0.5" aria-label="Secciones del portal">
              {PORTAL_TAB_ORDER.map((key) => {
                const Icon = PORTAL_TAB_ICONS[key];
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTabChange(key)}
                    className={`relative flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      active
                        ? "bg-indigo-50 font-semibold text-indigo-700"
                        : "font-medium text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-pill"
                        className="absolute inset-0 rounded-xl bg-indigo-50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon
                      className={`relative h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-[#a1a1a6]"}`}
                      aria-hidden
                    />
                    <span className="relative truncate">{PORTAL_TAB_LABELS[key]}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 border-t border-[#e5e5ea] pt-5 space-y-3">
              <div className="rounded-xl bg-[#fbfbfd] p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={badgeVariant} dot className="text-xs">
                    {subscriptionStatusLabel}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 text-[10px] text-[#a1a1a6]`}
                    title={lastRealtimeSyncAt ?? "Sin sync"}
                  >
                    <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`} aria-hidden />
                    <span>{syncLabel}</span>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-xs font-medium text-[#1d1d1f]">{companyName}</p>
              </div>

              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ── Área principal ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">

          {/* Header: visible en todos los tamaños */}
          <header className="rounded-2xl border border-[#e5e5ea] bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-[#1d1d1f] sm:text-xl">
                  {companyName}
                </h1>
                <p className="mt-0.5 text-xs text-[#6e6e73] md:hidden">
                  {PORTAL_TAB_LABELS[activeTab]}
                </p>
              </div>
              <Badge variant={badgeVariant} dot>
                {subscriptionStatusLabel}
              </Badge>
            </div>

            {/* Selector de sección — solo móvil */}
            <div className="mt-4 md:hidden">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {PORTAL_TAB_ORDER.map((key) => {
                  const Icon = PORTAL_TAB_ICONS[key];
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onTabChange(key)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {PORTAL_TAB_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Contenido de la tab activa */}
          <main className="min-w-0 flex-1 pb-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-6"
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
