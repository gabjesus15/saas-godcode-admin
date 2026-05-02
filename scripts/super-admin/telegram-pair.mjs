/**
 * Empareja el bot de Telegram con tu chat privado (obtiene chat_id vía long polling).
 * Requiere TELEGRAM_BOT_TOKEN en .env o .env.local (este script carga ambos).
 *
 * Uso: npm run telegram:pair
 */
import { config as loadEnv } from "dotenv";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: join(process.cwd(), ".env") });
loadEnv({ path: join(process.cwd(), ".env.local"), override: true });

const CACHE_PATH = join(__dirname, "..", ".cache", "telegram-chat-id.json");
const MAX_MS = 5 * 60 * 1000;

function apiUrl(token, method) {
	return `https://api.telegram.org/bot${token.trim()}/${method}`;
}

async function main() {
	const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
	if (!token) {
		console.error("[telegram:pair] Falta TELEGRAM_BOT_TOKEN en el entorno (.env / .env.local).");
		return 1;
	}

	const started = Date.now();
	let offset = 0;

	console.info("[telegram:pair] Descartando updates antiguos…");
	const flushRes = await fetch(`${apiUrl(token, "getUpdates")}?timeout=0`);
	const flushJson = await flushRes.json();
	if (!flushJson.ok) {
		console.error("[telegram:pair] getUpdates:", flushJson.description ?? flushRes.status);
		return 1;
	}
	for (const u of flushJson.result ?? []) {
		offset = Math.max(offset, u.update_id + 1);
	}

	console.info("[telegram:pair] Abre Telegram, habla con tu bot y envía /start o cualquier mensaje.");
	console.info(`[telegram:pair] Esperando hasta ${MAX_MS / 60000} min…`);

	while (Date.now() - started < MAX_MS) {
		const res = await fetch(`${apiUrl(token, "getUpdates")}?timeout=30&offset=${offset}`);
		const data = await res.json();
		if (!data.ok) {
			console.error("[telegram:pair] getUpdates:", data.description ?? res.status);
			return 1;
		}
		for (const u of data.result ?? []) {
			offset = u.update_id + 1;
			const msg = u.message ?? u.edited_message ?? u.channel_post;
			const chat = msg?.chat;
			if (chat?.type === "private" && chat.id != null) {
				const chatId = String(chat.id);
				await mkdir(dirname(CACHE_PATH), { recursive: true });
				await writeFile(CACHE_PATH, `${JSON.stringify({ chatId }, null, 2)}\n`, "utf8");
				console.info(`[telegram:pair] Listo. chat_id=${chatId}`);
				console.info(`[telegram:pair] Guardado en ${CACHE_PATH}`);
				console.info("[telegram:pair] Opcional: añade a .env TELEGRAM_CHAT_ID=" + chatId);
				return 0;
			}
		}
	}

	console.error("[telegram:pair] Tiempo agotado sin mensaje privado al bot.");
	return 1;
}

/** Sin `process.exit()`: en Windows evita assert de libuv al cerrar tras `fetch` (handles en cierre). */
process.exitCode = await main();
