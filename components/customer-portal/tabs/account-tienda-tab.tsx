"use client";

import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";

import {
  STORE_THEME_COLOR_FIELDS,
  STORE_THEME_COLOR_HELPERS,
  STORE_THEME_TEMPLATES,
} from "../customer-account-store-theme-constants";
import { StoreThemePreviewPanel } from "../store-theme-preview-panel";
import type {
  CompanySnapshot,
  StoreThemeAssetField,
  StoreThemeAutosaveStatus,
  StoreThemeConfig,
  StoreThemeResponse,
} from "../customer-account-types";
import { fmtDate } from "../customer-account-format";
import { PortalPageHeader } from "../portal-page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";

export type StoreThemeChecklistItem = { id: string; title: string; ok: boolean; detail: string };

export type StoreThemeContrastChange = {
  key: keyof StoreThemeConfig;
  label: string;
  from: string;
  to: string;
  ratio: number | null;
  min: number;
};

export type StoreThemeDiffRow = {
  key: keyof StoreThemeConfig;
  label: string;
  draftValue: string;
  publishedValue: string;
};

export type StoreThemeVersionRow = StoreThemeResponse["versions"][number];

export type AccountTiendaTabProps = {
  company: CompanySnapshot;
  publicationStateLabel: string;
  storeThemeUpdatedAt: string | null;
  storeThemeUpdatedBy: string | null;
  latestPublishedVersion: StoreThemeVersionRow | null;
  storeThemeAutosaveStatus: StoreThemeAutosaveStatus;
  storeThemeHasLocalUnsavedChanges: boolean;
  storeThemeAutosaveError: string | null;
  storeThemeError: string | null;
  storeThemeOk: string | null;
  storeThemeLoading: boolean;
  storeThemeDraft: StoreThemeConfig | null;
  setStoreThemeDraft: Dispatch<SetStateAction<StoreThemeConfig | null>>;
  restoreStoreThemeColorsFromProduction: () => void;
  storeThemeSaving: boolean;
  storeThemePublishing: boolean;
  storeThemePublished: StoreThemeConfig | null;
  storeThemeAssetLocalPreview: Record<StoreThemeAssetField, string | null>;
  storeThemeAssetUploading: StoreThemeAssetField | null;
  storeThemeAssetDragOver: StoreThemeAssetField | null;
  setStoreThemeAssetDragOver: Dispatch<SetStateAction<StoreThemeAssetField | null>>;
  handleStoreThemeAssetUpload: (field: StoreThemeAssetField, file: File | null) => void;
  storeThemeAssetHint: Record<StoreThemeAssetField, string | null>;
  setStoreThemeHasUnpublished: Dispatch<SetStateAction<boolean>>;
  setStoreThemeLocalPreview: (field: StoreThemeAssetField, nextUrl: string | null) => void;
  storeThemeChecklist: StoreThemeChecklistItem[];
  storeThemeContrastSuggestions: { changes: StoreThemeContrastChange[] };
  applyStoreThemeContrastSuggestions: () => void;
  storeThemeDiffRows: StoreThemeDiffRow[];
  storeThemePublishComment: string;
  setStoreThemePublishComment: Dispatch<SetStateAction<string>>;
  saveStoreDraft: () => void;
  publishStoreTheme: () => void;
  storeThemeHasUnpublished: boolean;
  storeThemeChecklistBlockingIssues: StoreThemeChecklistItem[];
  storePreviewTheme: StoreThemeConfig | null;
  storeThemeVersions: StoreThemeVersionRow[];
  restoreStoreVersion: (versionId: string) => Promise<void>;
  storeThemeRestoring: string | null;
  storeThemeSelectedTemplate: string;
  setStoreThemeSelectedTemplate: Dispatch<SetStateAction<string>>;
  applyStoreThemeTemplate: () => void;
  importStoreThemeJson: (file: File | null) => Promise<void>;
  exportStoreThemeJson: () => void;
  discardStoreThemeChanges: () => void;
};

export function AccountTiendaTab({
  company,
  publicationStateLabel,
  storeThemeUpdatedAt,
  storeThemeUpdatedBy,
  latestPublishedVersion,
  storeThemeAutosaveStatus,
  storeThemeHasLocalUnsavedChanges,
  storeThemeAutosaveError,
  storeThemeError,
  storeThemeOk,
  storeThemeLoading,
  storeThemeDraft,
  setStoreThemeDraft,
  restoreStoreThemeColorsFromProduction,
  storeThemeSaving,
  storeThemePublishing,
  storeThemePublished,
  storeThemeAssetLocalPreview,
  storeThemeAssetUploading,
  storeThemeAssetDragOver,
  setStoreThemeAssetDragOver,
  handleStoreThemeAssetUpload,
  storeThemeAssetHint,
  setStoreThemeHasUnpublished,
  setStoreThemeLocalPreview,
  storeThemeChecklist,
  storeThemeContrastSuggestions,
  applyStoreThemeContrastSuggestions,
  storeThemeDiffRows,
  storeThemePublishComment,
  setStoreThemePublishComment,
  saveStoreDraft,
  publishStoreTheme,
  storeThemeHasUnpublished,
  storeThemeChecklistBlockingIssues,
  storePreviewTheme,
  storeThemeVersions,
  restoreStoreVersion,
  storeThemeRestoring,
  storeThemeSelectedTemplate,
  setStoreThemeSelectedTemplate,
  applyStoreThemeTemplate,
  importStoreThemeJson,
  exportStoreThemeJson,
  discardStoreThemeChanges,
}: AccountTiendaTabProps) {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Tema del menú público"
        description="Edita colores, logo y publicación del borrador. En pantallas grandes la vista previa queda fija a la derecha."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.05] md:p-8">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-500">Estado editorial</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{publicationStateLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-500">Última edición</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {storeThemeUpdatedAt ? fmtDate(storeThemeUpdatedAt, company.timezone) : "-"}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">{storeThemeUpdatedBy ?? "sin autor"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-500">Última publicación</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {latestPublishedVersion ? fmtDate(latestPublishedVersion.createdAt, company.timezone) : "-"}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">{latestPublishedVersion?.createdByEmail ?? "sin registro"}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">Sincronización</span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {storeThemeAutosaveStatus === "saving"
                ? "Guardando cambios…"
                : storeThemeAutosaveStatus === "pending"
                  ? "Cambios detectados; se guardarán en segundos."
                  : storeThemeAutosaveStatus === "saved"
                    ? "Borrador guardado automáticamente."
                    : storeThemeAutosaveStatus === "error"
                      ? "Error en guardado automático; puedes guardar manualmente."
                      : "Sin cambios pendientes."}
            </span>
            {storeThemeHasLocalUnsavedChanges ? (
              <span className="text-amber-700 dark:text-amber-300">Cambios locales sin enviar.</span>
            ) : null}
          </div>
          {storeThemeAutosaveError ? <p className="mt-1.5 text-red-600 dark:text-red-300">{storeThemeAutosaveError}</p> : null}
          {storeThemeError ? <p className="mt-1.5 text-red-600 dark:text-red-300">{storeThemeError}</p> : null}
          {storeThemeOk ? <p className="mt-1.5 text-emerald-700 dark:text-emerald-300">{storeThemeOk}</p> : null}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-8">
            {storeThemeLoading || !storeThemeDraft ? (
              <p className="text-sm text-zinc-500">Cargando configuración...</p>
            ) : (
              <>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="identidad"
                  className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700"
                >
                  <AccordionItem value="identidad" className="border-t-0">
                    <AccordionTrigger className="px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">Identidad</AccordionTrigger>
                    <AccordionContent className="text-zinc-600 dark:text-zinc-400">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Identidad visual</p>
              <label className="mt-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Nombre visible
                <input
                  value={storeThemeDraft.displayName}
                  onChange={(event) => setStoreThemeDraft((prev) => (prev ? { ...prev, displayName: event.target.value } : prev))}
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder={company.name}
                />
                <p className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Se muestra en el header del menú y en la portada de la tienda.
                </p>
              </label>
            </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="colores">
                    <AccordionTrigger className="px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">Colores</AccordionTrigger>
                    <AccordionContent className="text-zinc-600 dark:text-zinc-400">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Paleta</p>
                <button
                  type="button"
                  onClick={restoreStoreThemeColorsFromProduction}
                  disabled={storeThemeLoading || storeThemeSaving || storeThemePublishing || !storeThemePublished}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Restaurar colores de producción
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {STORE_THEME_COLOR_FIELDS.map(([key, label]) => (
                  <label key={key} className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {label}
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                      <input
                        type="color"
                        value={storeThemeDraft[key]}
                        onChange={(event) => setStoreThemeDraft((prev) => (prev ? { ...prev, [key]: event.target.value } : prev))}
                        className="h-8 w-10 rounded-md border border-zinc-300"
                      />
                      <span className="text-xs text-zinc-500">{storeThemeDraft[key]}</span>
                    </div>
                    <p className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">{STORE_THEME_COLOR_HELPERS[key]}</p>
                  </label>
                ))}
              </div>
            </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="medios">
                    <AccordionTrigger className="px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">Medios</AccordionTrigger>
                    <AccordionContent className="text-zinc-600 dark:text-zinc-400">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Logo y fondo</p>
              <div className="mt-2 space-y-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  URL logo
                  <input
                    value={storeThemeDraft.logoUrl}
                    onChange={(event) => setStoreThemeDraft((prev) => (prev ? { ...prev, logoUrl: event.target.value } : prev))}
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="https://..."
                  />
                  <p className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    Aparece en la barra superior del menú y refuerza identidad de marca.
                  </p>
                </label>

                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  URL fondo
                  <input
                    value={storeThemeDraft.backgroundImageUrl}
                    onChange={(event) =>
                      setStoreThemeDraft((prev) => (prev ? { ...prev, backgroundImageUrl: event.target.value } : prev))
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="https://..."
                  />
                  <p className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    Se ve en la atmósfera general del menú y se combina con el color de fondo.
                  </p>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["logoUrl", "Logo", "Ideal para cuadrado (min 512x512)."],
                      ["backgroundImageUrl", "Fondo", "Ideal panorámica horizontal (min 1600x900)."],
                    ] as const
                  ).map(([field, title, hint]) => {
                    const previewUrl = storeThemeAssetLocalPreview[field] || storeThemeDraft[field] || "";
                    const isUploading = storeThemeAssetUploading === field;
                    const isDragOver = storeThemeAssetDragOver === field;
                    return (
                      <div
                        key={field}
                        className={`rounded-xl border bg-white p-3 transition dark:bg-zinc-900 ${isDragOver ? "border-indigo-400 ring-2 ring-indigo-200 dark:border-indigo-500 dark:ring-indigo-900/50" : "border-zinc-300 dark:border-zinc-700"}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setStoreThemeAssetDragOver(field);
                        }}
                        onDragLeave={(event) => {
                          event.preventDefault();
                          setStoreThemeAssetDragOver((prev) => (prev === field ? null : prev));
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          setStoreThemeAssetDragOver(null);
                          const dropped = event.dataTransfer.files?.[0] ?? null;
                          void handleStoreThemeAssetUpload(field, dropped);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</p>
                          {isUploading ? (
                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">Subiendo...</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Arrastra imagen aquí o selecciona archivo. {hint}
                        </p>

                        <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/70">
                          {previewUrl ? (
                            <div className="relative h-32 w-full">
                              <Image
                                src={previewUrl}
                                alt={`Preview ${title}`}
                                fill
                                sizes="(max-width: 640px) 100vw, 50vw"
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="grid h-32 place-items-center text-xs text-zinc-500 dark:text-zinc-400">
                              Sin imagen cargada
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                            Seleccionar archivo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => {
                                void handleStoreThemeAssetUpload(field, event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setStoreThemeDraft((prev) => (prev ? { ...prev, [field]: "" } : prev));
                              setStoreThemeHasUnpublished(true);
                              setStoreThemeLocalPreview(field, null);
                            }}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            Limpiar
                          </button>
                        </div>

                        {storeThemeAssetHint[field] ? (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{storeThemeAssetHint[field]}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="publicar">
                    <AccordionTrigger className="px-4 py-4 text-sm text-zinc-900 dark:text-zinc-100">Publicar</AccordionTrigger>
                    <AccordionContent className="text-zinc-600 dark:text-zinc-400">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Publicación</p>

              <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Checklist de calidad visual</p>
                <div className="mt-2 space-y-1.5">
                  {storeThemeChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-md border px-2.5 py-1.5 text-xs ${item.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"}`}
                    >
                      <p className="font-semibold">
                        {item.ok ? "OK" : "Revisar"}: {item.title}
                      </p>
                      <p className="mt-0.5 opacity-90">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {storeThemeContrastSuggestions.changes.length > 0 ? (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-300">
                      Sugerencias automáticas de contraste
                    </p>
                    <button
                      type="button"
                      onClick={applyStoreThemeContrastSuggestions}
                      className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                    >
                      Aplicar sugerencias
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {storeThemeContrastSuggestions.changes.map((change) => (
                      <div
                        key={change.key}
                        className="rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs text-indigo-900 dark:border-indigo-800 dark:bg-zinc-900/70 dark:text-indigo-100"
                      >
                        <p className="font-semibold">
                          {change.label}: {change.from} a {change.to}
                        </p>
                        <p className="mt-0.5 opacity-90">
                          Contraste estimado: {change.ratio ? change.ratio.toFixed(2) : "-"} (objetivo mínimo{" "}
                          {change.min.toFixed(1)})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Diferencias vs producción</p>
                {storeThemeDiffRows.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">No hay diferencias entre borrador y producción.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {storeThemeDiffRows.map((row) => (
                      <div
                        key={row.key}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800/60"
                      >
                        <p className="font-semibold text-zinc-700 dark:text-zinc-200">{row.label}</p>
                        <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">Producción: {row.publishedValue || "-"}</p>
                        <p className="text-zinc-700 dark:text-zinc-200">Borrador: {row.draftValue || "-"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Comentario de publicación
                <textarea
                  value={storeThemePublishComment}
                  onChange={(event) => setStoreThemePublishComment(event.target.value)}
                  placeholder="Ej: Ajuste de paleta para campaña de invierno"
                  className="mt-1 min-h-20 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  maxLength={300}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveStoreDraft}
                  disabled={storeThemeSaving || storeThemePublishing || storeThemeLoading}
                  className="h-11 rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {storeThemeSaving ? "Guardando..." : "Guardar borrador"}
                </button>
                <button
                  type="button"
                  onClick={publishStoreTheme}
                  disabled={
                    storeThemePublishing || storeThemeLoading || !storeThemeHasUnpublished || storeThemeDiffRows.length === 0
                  }
                  className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {storeThemePublishing ? "Publicando..." : "Publicar cambios"}
                </button>
              </div>

              {storeThemeChecklistBlockingIssues.length > 0 ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Recomendación: mejora los contrastes marcados para una mejor legibilidad antes de publicar.
                </p>
              ) : null}

              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Guardar borrador conserva el trabajo sin impactar clientes. Publicar aplica cambios en producción.
              </p>

              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {storeThemeHasUnpublished ? "Hay cambios sin publicar." : "El borrador coincide con producción."}
                {storeThemeUpdatedAt ? ` Última edición: ${fmtDate(storeThemeUpdatedAt, company.timezone)}.` : ""}
                {storeThemeUpdatedBy ? ` Por: ${storeThemeUpdatedBy}.` : ""}
              </p>
            </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
                  <details className="group">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                      Opciones avanzadas
                    </summary>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Acciones extra para acelerar trabajo entre marcas o recuperar estado.
                    </p>

                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Plantillas</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                          <select
                            value={storeThemeSelectedTemplate}
                            onChange={(event) => setStoreThemeSelectedTemplate(event.target.value)}
                            aria-label="Seleccionar plantilla de tema"
                            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            {STORE_THEME_TEMPLATES.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} - {template.description}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={applyStoreThemeTemplate}
                            className="h-11 rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            Aplicar plantilla
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Importar y exportar</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60">
                            Importar tema JSON
                            <input
                              type="file"
                              accept="application/json,.json"
                              className="mt-2 block w-full text-xs"
                              onChange={(event) => {
                                void importStoreThemeJson(event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={exportStoreThemeJson}
                            disabled={!storeThemeDraft}
                            className="h-11 self-end rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            Exportar tema JSON
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Recuperación</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Vuelve al estado de producción si quieres descartar el borrador actual.
                        </p>
                        <button
                          type="button"
                          onClick={discardStoreThemeChanges}
                          disabled={storeThemeLoading || storeThemeSaving || storeThemePublishing || !storeThemePublished}
                          className="mt-2 h-11 rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Descartar cambios
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="mt-8 min-w-0 space-y-4 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vista previa</h3>
            {storePreviewTheme ? (
              <StoreThemePreviewPanel
                theme={storePreviewTheme}
                companyName={company.name}
                previewUrl={company.publicSlug ? `/${company.publicSlug}/menu` : null}
                hasUnpublishedChanges={storeThemeHasUnpublished}
              />
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Cargando preview...</p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-indigo-500/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-indigo-500/[0.04] md:p-6">
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                Versiones publicadas
              </summary>
              <div className="mt-3 space-y-2">
                {storeThemeVersions.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aún no hay versiones publicadas.</p>
                ) : (
                  storeThemeVersions.map((version) => (
                    <div key={version.id} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{version.theme.displayName || company.name}</p>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{fmtDate(version.createdAt, company.timezone)}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Publicado por: {version.createdByEmail ?? "sistema"}</p>
                      <button
                        type="button"
                        onClick={() => void restoreStoreVersion(version.id)}
                        disabled={storeThemeRestoring === version.id || storeThemeLoading}
                        className="mt-2 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        {storeThemeRestoring === version.id ? "Restaurando..." : "Usar como borrador"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>
        </aside>
      </div>
    </div>
  );
}
