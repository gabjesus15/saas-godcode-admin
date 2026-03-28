import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

describe("validateApiKey", () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.SERVICE_API_KEY;
	});

	async function getValidateApiKey() {
		const mod = await import("../../services/onboarding-billing/lib/api-key-auth");
		return mod.validateApiKey;
	}

	it("retorna 503 cuando SERVICE_API_KEY no esta configurada", async () => {
		process.env.SERVICE_API_KEY = "";
		const validateApiKey = await getValidateApiKey();
		const req = new NextRequest("http://localhost:3001/api/test");
		const result = validateApiKey(req);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(503);
		}
	});

	it("retorna 401 cuando el header no coincide", async () => {
		process.env.SERVICE_API_KEY = "correct-key";
		const validateApiKey = await getValidateApiKey();
		const req = new NextRequest("http://localhost:3001/api/test", {
			headers: { "x-internal-api-key": "wrong-key" },
		});
		const result = validateApiKey(req);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(401);
		}
	});

	it("retorna 401 cuando no se envia el header", async () => {
		process.env.SERVICE_API_KEY = "correct-key";
		const validateApiKey = await getValidateApiKey();
		const req = new NextRequest("http://localhost:3001/api/test");
		const result = validateApiKey(req);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(401);
		}
	});

	it("retorna ok:true cuando el header coincide con la key", async () => {
		process.env.SERVICE_API_KEY = "my-secret";
		const validateApiKey = await getValidateApiKey();
		const req = new NextRequest("http://localhost:3001/api/test", {
			headers: { "x-internal-api-key": "my-secret" },
		});
		const result = validateApiKey(req);

		expect(result.ok).toBe(true);
	});
});
