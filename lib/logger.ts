import { randomUUID } from "crypto";

export type LogContext = {
	requestId: string;
	service?: string;
	endpoint?: string;
	method?: string;
	[key: string]: unknown;
};

export function createRequestContext(
	endpoint: string,
	method: string,
	service = "bff"
): LogContext {
	return {
		requestId: randomUUID(),
		service,
		endpoint,
		method,
	};
}

function formatLog(
	level: string,
	message: string,
	ctx?: LogContext,
	extra?: Record<string, unknown>
): string {
	const payload: Record<string, unknown> = {
		level,
		message,
		timestamp: new Date().toISOString(),
		...ctx,
		...extra,
	};
	return JSON.stringify(payload);
}

export const logger = {
	info(message: string, ctx?: LogContext, extra?: Record<string, unknown>): void {
		console.log(formatLog("info", message, ctx, extra));
	},

	warn(message: string, ctx?: LogContext, extra?: Record<string, unknown>): void {
		console.warn(formatLog("warn", message, ctx, extra));
	},

	error(message: string, ctx?: LogContext, extra?: Record<string, unknown>): void {
		console.error(formatLog("error", message, ctx, extra));
	},
};

export function startTimer(): () => number {
	const start = performance.now();
	return () => Math.round(performance.now() - start);
}
