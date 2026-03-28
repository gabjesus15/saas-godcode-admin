import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const isDev = process.env.NODE_ENV === "development";

export function jsonOk<T>(data: T, init?: { status?: number }): NextResponse {
	return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function jsonError(
	status: number,
	message: string,
	opts?: { code?: string; issues?: z.ZodIssue[] },
): NextResponse {
	const body: Record<string, unknown> = { error: message };
	if (opts?.code) body.code = opts.code;
	if (opts?.issues && isDev) body.issues = opts.issues;
	return NextResponse.json(body, { status });
}

/**
 * Parsea y valida el body JSON con Zod. En desarrollo incluye `issues` en la respuesta 400.
 */
export async function parseJsonBody<T extends z.ZodTypeAny>(
	req: NextRequest,
	schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
	let raw: unknown;
	try {
		raw = await req.json();
	} catch {
		return {
			ok: false,
			response: jsonError(400, "Cuerpo JSON inválido", { code: "invalid_json" }),
		};
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		return {
			ok: false,
			response: jsonError(400, "Validación fallida", {
				code: "validation_error",
				issues: parsed.error.issues,
			}),
		};
	}
	return { ok: true, data: parsed.data };
}
