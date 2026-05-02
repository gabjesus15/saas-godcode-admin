"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import type { SupabaseAuthScope } from "@/utils/supabase/auth-scope";

export type TotpMfaAppearance = "admin" | "portal";

type TotpRow = {
	id: string;
	friendly_name?: string | null;
	factor_type?: string | null;
	status?: string | null;
};

function svgToDataUrl(svg: string): string {
	const trimmed = svg.trim();
	if (trimmed.startsWith("data:")) return trimmed;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
}

export type TotpMfaEnrollPanelProps = {
	authScope: SupabaseAuthScope;
	friendlyNameDefault: string;
	/** Ej. `requireAdminRole` en panel super-admin; omitir en portal de cuenta. */
	assertCanMutate?: () => Promise<{ ok: boolean; error?: string }>;
	readOnly?: boolean;
	readOnlyMessage?: React.ReactNode;
	/** Ignorado si `omitHeader` es true. */
	title?: string;
	description?: React.ReactNode;
	showSupabaseEnrollHint?: boolean;
	/** Estilo alineado al portal cliente (`/cuenta`). */
	appearance?: TotpMfaAppearance;
	/** Oculta título y descripción (p. ej. si el padre ya mostró un hero). */
	omitHeader?: boolean;
	/** Texto del CTA principal de alta. */
	enrollButtonLabel?: string;
};

export function TotpMfaEnrollPanel({
	authScope,
	friendlyNameDefault,
	assertCanMutate,
	readOnly,
	readOnlyMessage,
	title,
	description,
	showSupabaseEnrollHint,
	appearance = "admin",
	omitHeader = false,
	enrollButtonLabel,
}: TotpMfaEnrollPanelProps) {
	const portal = appearance === "portal";
	const router = useRouter();
	const supabase = useMemo(() => createSupabaseBrowserClient(authScope), [authScope]);

	const [loadingList, setLoadingList] = useState(true);
	const [totpFactors, setTotpFactors] = useState<TotpRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);
	const [verifyCode, setVerifyCode] = useState("");

	const refreshFactors = useCallback(async () => {
		setLoadingList(true);
		setError(null);
		try {
			const { data, error: listErr } = await supabase.auth.mfa.listFactors();
			if (listErr) throw listErr;
			const raw = data as { totp?: TotpRow[]; all?: TotpRow[] } | null;
			const fromTotp = raw?.totp ?? [];
			const fromAll = (raw?.all ?? []).filter((f) => String(f.factor_type ?? "").toLowerCase() === "totp");
			const byId = new Map<string, TotpRow>();
			for (const f of [...fromTotp, ...fromAll]) {
				if (f?.id) byId.set(f.id, f);
			}
			setTotpFactors(Array.from(byId.values()));
		} catch (e) {
			setTotpFactors([]);
			setError(e instanceof Error ? e.message : "No se pudieron cargar los factores MFA.");
		} finally {
			setLoadingList(false);
		}
	}, [supabase]);

	useEffect(() => {
		void refreshFactors();
	}, [refreshFactors]);

	const verifiedFactors = totpFactors.filter((f) => String(f.status ?? "").toLowerCase() === "verified");

	const runAssert = async (): Promise<boolean> => {
		if (!assertCanMutate) return true;
		const auth = await assertCanMutate();
		if (!auth.ok) {
			setError(auth.error ?? "No autorizado");
			return false;
		}
		return true;
	};

	const startEnroll = async () => {
		setError(null);
		if (!(await runAssert())) return;
		setBusy(true);
		try {
			const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
				factorType: "totp",
				friendlyName: friendlyNameDefault,
			});
			if (enrollErr) throw enrollErr;
			if (!data?.id || !data.totp?.qr_code) {
				throw new Error("Respuesta de registro MFA incompleta.");
			}
			setEnrollFactorId(data.id);
			setQrDataUrl(svgToDataUrl(data.totp.qr_code));
			setSecret(data.totp.secret ?? null);
			setVerifyCode("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "No se pudo iniciar el registro del autenticador.");
		} finally {
			setBusy(false);
		}
	};

	const cancelEnroll = async () => {
		if (!enrollFactorId) {
			setQrDataUrl(null);
			setSecret(null);
			setVerifyCode("");
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: enrollFactorId });
			if (unErr) throw unErr;
		} catch {
			// Si falla el unenroll, igual limpiamos UI; el factor huérfano se puede gestionar desde Supabase.
		} finally {
			setEnrollFactorId(null);
			setQrDataUrl(null);
			setSecret(null);
			setVerifyCode("");
			setBusy(false);
			await refreshFactors();
		}
	};

	const confirmEnroll = async () => {
		if (!enrollFactorId) return;
		const code = verifyCode.replace(/\s/g, "");
		if (!/^\d{6}$/.test(code)) {
			setError("Introduce el código de 6 dígitos que muestra la app.");
			return;
		}
		setError(null);
		if (!(await runAssert())) return;
		setBusy(true);
		try {
			const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrollFactorId });
			if (chErr || !ch?.id) throw chErr ?? new Error("No se pudo crear el desafío MFA.");

			const { error: vErr } = await supabase.auth.mfa.verify({
				factorId: enrollFactorId,
				challengeId: ch.id,
				code,
			});
			if (vErr) throw vErr;

			setEnrollFactorId(null);
			setQrDataUrl(null);
			setSecret(null);
			setVerifyCode("");
			await refreshFactors();
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Código incorrecto o expirado. Genera uno nuevo e inténtalo otra vez.");
		} finally {
			setBusy(false);
		}
	};

	if (readOnly) {
		return (
			<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
				{readOnlyMessage ??
					"Modo solo lectura: no puedes registrar el autenticador en esta sesión."}
			</p>
		);
	}

	const portalPrimaryBtn =
		"bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500";

	return (
		<div className="min-w-0 space-y-6">
			{!omitHeader && title ? (
				<div>
					<h3
						className={cn(
							"font-semibold text-zinc-900 dark:text-zinc-100",
							portal ? "text-xl tracking-tight text-[#1d1d1f]" : "text-lg",
						)}
					>
						{title}
					</h3>
					{description ? (
						<div
							className={cn(
								"mt-1 text-sm",
								portal ? "leading-relaxed text-[#6e6e73]" : "text-zinc-600 dark:text-zinc-400",
							)}
						>
							{description}
						</div>
					) : null}
				</div>
			) : null}

			{showSupabaseEnrollHint ? (
				<div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/35 dark:text-sky-100">
					<p className="font-medium">Si ves «MFA enroll is disabled for TOTP»</p>
					<p className="mt-1 text-sky-900/90 dark:text-sky-200/95">
						En Supabase no es lo mismo «activar TOTP» que «permitir registrar un autentificador». El menú de TOTP suele tener algo como{" "}
						<strong>Enabled / Habilitado</strong> (permite <em>alta</em> + códigos) y{" "}
						<strong>Verify enabled</strong> (solo validar códigos, sin dar de alta nuevos factores).
					</p>
					<p className="mt-2 text-sky-900/90 dark:text-sky-200/95">
						Para usar esta sección: en{" "}
						<strong>Authentication → Providers / MFA → TOTP</strong>, elige la opción que incluya el{" "}
						<strong>registro / enroll</strong> (normalmente <strong>Enabled</strong>, no solo Verify), pulsa{" "}
						<strong>Guardar</strong> y espera unos segundos antes de pulsar «Añadir autenticador» otra vez.
					</p>
				</div>
			) : null}

			{error ? (
				<div
					className={cn(
						"rounded-xl border px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
						portal ? "border-red-200/90 bg-red-50/90" : "rounded-lg border-red-200 bg-red-50",
					)}
				>
					<p>{error}</p>
					{typeof error === "string" && error.toLowerCase().includes("enroll is disabled") ? (
						<p className="mt-2 border-t border-red-200/80 pt-2 text-red-900 dark:border-red-800/60 dark:text-red-100">
							Revisa el desplegable de TOTP en el dashboard: si está en «Verify enabled» únicamente, cámbialo a «Enabled / Habilitado» para permitir el alta de factores y guarda cambios.
						</p>
					) : null}
				</div>
			) : null}

			<section
				className={cn(
					"rounded-2xl border p-4 sm:p-5",
					portal
						? "border-[#e5e5ea] bg-white shadow-sm"
						: "border-zinc-200 bg-white/80 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80",
				)}
			>
				<h4
					className={cn(
						"text-sm font-semibold uppercase tracking-wide",
						portal ? "text-[#a1a1a6]" : "text-zinc-500 dark:text-zinc-400",
					)}
				>
					Estado del autenticador
				</h4>
				{loadingList ? (
					<p className={cn("mt-2 text-sm", portal ? "text-[#6e6e73]" : "text-zinc-500")}>Cargando…</p>
				) : verifiedFactors.length === 0 ? (
					<p className={cn("mt-2 text-sm", portal ? "text-[#6e6e73]" : "text-zinc-600 dark:text-zinc-300")}>
						Aún no enlazaste ninguna app en esta cuenta.
					</p>
				) : (
					<ul className="mt-2 space-y-2">
						{verifiedFactors.map((f) => (
							<li
								key={f.id}
								className={cn(
									"flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
									portal
										? "border-emerald-200/90 bg-emerald-50/70"
										: "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30",
								)}
							>
								<span
									className={cn(
										"font-medium",
										portal ? "text-emerald-900" : "text-emerald-900 dark:text-emerald-100",
									)}
								>
									{f.friendly_name ?? "TOTP"} ·{" "}
									<span className={portal ? "text-emerald-700" : "text-emerald-700 dark:text-emerald-300"}>activo</span>
								</span>
								<span className={cn("font-mono text-xs", portal ? "text-[#a1a1a6]" : "text-zinc-500")}>
									{f.id.slice(0, 8)}…
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			{!enrollFactorId ? (
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						className={portal ? portalPrimaryBtn : undefined}
						onClick={() => void startEnroll()}
						disabled={busy || loadingList}
					>
						{busy ? "Preparando…" : enrollButtonLabel ?? "Añadir autenticador (TOTP)"}
					</Button>
				</div>
			) : (
				<section
					className={cn(
						"space-y-4 rounded-2xl border p-4 sm:p-5",
						portal
							? "border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-white shadow-sm"
							: "border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/30",
					)}
				>
					<p className={cn("text-sm leading-relaxed", portal ? "text-[#424245]" : "text-zinc-700 dark:text-zinc-300")}>
						<span className={cn("font-semibold", portal ? "text-[#1d1d1f]" : "text-zinc-900 dark:text-zinc-100")}>1.</span>{" "}
						En la app, pulsa el botón para <strong>añadir cuenta</strong> y escanea el código de abajo.
						<br />
						<span className={cn("font-semibold", portal ? "text-[#1d1d1f]" : "text-zinc-900 dark:text-zinc-100")}>2.</span>{" "}
						Ese código QR solo <strong>enlaza</strong> tu cuenta con la app; para entrar después usarás el código numérico que cambia cada pocos
						segundos.
						<br />
						<span className={cn("font-semibold", portal ? "text-[#1d1d1f]" : "text-zinc-900 dark:text-zinc-100")}>3.</span>{" "}
						Escribe aquí los <strong>6 dígitos</strong> que muestra la app y confirma (muchas apps rellenan el código solo al pegar o al enfocar el
						campo).
					</p>
					{qrDataUrl ? (
						<div
							className={cn(
								"flex justify-center rounded-2xl bg-white p-4",
								portal ? "ring-1 ring-[#e5e5ea]" : "dark:bg-zinc-950",
							)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={qrDataUrl}
								alt="Código QR para registrar esta cuenta en tu app de autenticación"
								className={cn("max-w-full", portal ? "h-48 w-48" : "h-44 w-44")}
								width={portal ? 192 : 176}
								height={portal ? 192 : 176}
							/>
						</div>
					) : null}
					{secret ? (
						<div
							className={cn(
								"rounded-xl border bg-white px-3 py-2",
								portal ? "border-[#e5e5ea]" : "border-zinc-200 dark:border-zinc-600 dark:bg-zinc-900",
							)}
						>
							<p className={cn("text-xs font-medium", portal ? "text-[#6e6e73]" : "text-zinc-500 dark:text-zinc-400")}>
								Si no puedes escanear el QR, introduce esta clave manualmente en la app:
							</p>
							<p className={cn("mt-1 break-all font-mono text-sm", portal ? "text-[#1d1d1f]" : "text-zinc-900 dark:text-zinc-100")}>
								{secret}
							</p>
						</div>
					) : null}
					<div className="max-w-xs">
						<label
							htmlFor="mfa-verify-code-panel"
							className={cn(
								"mb-1 block text-sm font-medium",
								portal ? "text-[#1d1d1f]" : "text-zinc-800 dark:text-zinc-200",
							)}
						>
							Código de 6 dígitos
						</label>
						<Input
							id="mfa-verify-code-panel"
							value={verifyCode}
							onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="000000"
							className={cn(
								"font-mono",
								portal ? "h-12 text-lg tracking-[0.25em]" : "tracking-widest",
							)}
							disabled={busy}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="default"
							className={portal ? portalPrimaryBtn : undefined}
							onClick={() => void confirmEnroll()}
							disabled={busy}
						>
							Confirmar y activar
						</Button>
						<Button type="button" variant="outline" onClick={() => void cancelEnroll()} disabled={busy}>
							Cancelar
						</Button>
					</div>
				</section>
			)}
		</div>
	);
}
