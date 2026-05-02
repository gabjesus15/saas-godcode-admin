/**
 * Envía alertas por Telegram cuando hay nuevas filas en onboarding_applications.
 *
 * Uso:
 *   npm run notify:telegram              — usa marca de agua en scripts/.cache/
 *   npm run notify:telegram -- --bootstrap — fija marca al último created_at existente (sin enviar)
 *
 * TELEGRAM_CHAT_ID: variable de entorno (opcional si existe pairing en cache).
 * Prioridad: env > scripts/.cache/telegram-chat-id.json
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import type { Database } from "@/types/supabase-database";
import {
	computeInitialOnboardingWatermark,
	fetchLatestOnboardingApplicationCreatedAt,
	fetchOnboardingApplicationsCreatedAfter,
	formatOnboardingApplicationsTelegramHtml,
	maxCreatedAt,
	parseTelegramChatIds,
	sendTelegramHtmlMessage,
} from "@/lib/super-admin/telegram-alerts";

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: join(process.cwd(), ".env") });
loadEnv({ path: join(process.cwd(), ".env.local"), override: true });

const ROOT = join(__dirname, "..");
const CACHE_DIR = join(ROOT, ".cache");
const CHAT_ID_FILE = join(CACHE_DIR, "telegram-chat-id.json");
const STATE_FILE = join(CACHE_DIR, "telegram-notify-state.json");

type LocalState = {
	lastNotifiedCreatedAt: string;
};

async function readChatIdFromCache(): Promise<string | null> {
	if (!existsSync(CHAT_ID_FILE)) return null;
	try {
		const raw = await readFile(CHAT_ID_FILE, "utf8");
		const j = JSON.parse(raw) as { chatId?: string };
		return typeof j.chatId === "string" && j.chatId.length > 0 ? j.chatId : null;
	} catch {
		return null;
	}
}

async function readLocalWatermark(): Promise<string | null> {
	if (!existsSync(STATE_FILE)) return null;
	try {
		const raw = await readFile(STATE_FILE, "utf8");
		const j = JSON.parse(raw) as LocalState;
		return typeof j.lastNotifiedCreatedAt === "string" ? j.lastNotifiedCreatedAt : null;
	} catch {
		return null;
	}
}

async function writeLocalWatermark(iso: string): Promise<void> {
	await mkdir(CACHE_DIR, { recursive: true });
	await writeFile(STATE_FILE, `${JSON.stringify({ lastNotifiedCreatedAt: iso }, null, 2)}\n`, "utf8");
}

async function main(): Promise<number> {
	const bootstrap = process.argv.includes("--bootstrap");

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!url || !key) {
		console.error("[notify:telegram] Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
		return 1;
	}

	const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
	if (!botToken) {
		console.error("[notify:telegram] Falta TELEGRAM_BOT_TOKEN.");
		return 1;
	}

	const fromEnv = parseTelegramChatIds(process.env.TELEGRAM_CHAT_ID);
	const fromFile = await readChatIdFromCache();
	const chatIds = fromEnv.length > 0 ? fromEnv : fromFile ? [fromFile] : [];

	if (chatIds.length === 0) {
		console.error("[notify:telegram] Sin destino: define TELEGRAM_CHAT_ID o ejecuta npm run telegram:pair");
		return 1;
	}

	const supabase = createClient<Database>(url, key, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	if (bootstrap) {
		const latest = await fetchLatestOnboardingApplicationCreatedAt(supabase);
		const wm = latest ?? new Date().toISOString();
		await writeLocalWatermark(wm);
		console.info(`[notify:telegram] --bootstrap: marca de agua = ${wm} (sin enviar mensajes).`);
		return 0;
	}

	let watermark = await readLocalWatermark();
	if (!watermark) {
		watermark = await computeInitialOnboardingWatermark(supabase);
		await writeLocalWatermark(watermark);
		console.info(
			`[notify:telegram] Primera ejecución: marca al último onboarding (${watermark}). Sin enviar (solo alineación).`,
		);
		return 0;
	}

	const rows = await fetchOnboardingApplicationsCreatedAfter(supabase, watermark);
	if (rows.length === 0) {
		console.info("[notify:telegram] Nada nuevo.");
		return 0;
	}

	const panelBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
	const text = formatOnboardingApplicationsTelegramHtml(rows, panelBase);

	await sendTelegramHtmlMessage({ botToken, chatIds, text });

	const nextWm = maxCreatedAt(rows);
	await writeLocalWatermark(nextWm);
	console.info(`[notify:telegram] Enviado (${rows.length}). Nueva marca: ${nextWm}`);
	return 0;
}

/** Sin top-level await (tsx/CJS) ni `process.exit()` brusco tras `fetch` en Windows. */
void (async () => {
	try {
		process.exitCode = await main();
	} catch (e) {
		console.error("[notify:telegram]", e instanceof Error ? e.message : e);
		process.exitCode = 1;
	}
})();
