"use client";

import { LogOut } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-3 py-5 sm:px-4 md:flex-row md:gap-8 lg:px-8">
        <aside className="hidden w-64 shrink-0 self-start rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm ring-1 ring-indigo-500/[0.06] dark:border-zinc-800 dark:bg-zinc-900 dark:ring-indigo-400/10 md:sticky md:top-6 md:block">
          <div className="mb-6 border-b border-zinc-100 pb-5 dark:border-zinc-800">
            <SaasLogo />
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
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
                  className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "border-l-2 border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-100"
                      : "border-l-2 border-transparent font-medium text-zinc-600 hover:bg-indigo-50/40 hover:text-indigo-800 dark:text-zinc-400 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-200"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600 dark:text-indigo-400" : "opacity-80"}`}
                    aria-hidden
                  />
                  <span className="truncate">{PORTAL_TAB_LABELS[key]}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="rounded-xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm shadow-indigo-500/[0.04] dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {companyName}
                </h1>
                <p className="mt-1 text-sm font-medium text-indigo-700 md:hidden dark:text-indigo-300">
                  {PORTAL_TAB_LABELS[activeTab]}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{subscriptionStatusLabel}</span>
                <span className="hidden text-zinc-300 dark:text-zinc-600 sm:inline" aria-hidden>
                  ·
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400" title={syncLine}>
                  {syncLine}
                </span>
              </div>
            </div>

            <div className="mt-4 md:hidden">
              <label className="sr-only" htmlFor="portal-section-mobile">
                Sección
              </label>
              <select
                id="portal-section-mobile"
                value={activeTab}
                onChange={(e) => onTabChange(e.target.value as PortalTab)}
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {PORTAL_TAB_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {PORTAL_TAB_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <main className="min-w-0 flex-1 space-y-8 overflow-x-hidden pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
