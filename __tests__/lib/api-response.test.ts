import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "../../lib/api/response";

describe("parseJsonBody", () => {
	it("acepta JSON válido según schema", async () => {
		const req = new NextRequest("http://localhost/api", {
			method: "POST",
			body: JSON.stringify({ foo: "bar" }),
			headers: { "content-type": "application/json" },
		});
		const r = await parseJsonBody(req, z.object({ foo: z.string().min(1) }));
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.data.foo).toBe("bar");
	});

	it("rechaza JSON inválido", async () => {
		const req = new NextRequest("http://localhost/api", {
			method: "POST",
			body: "not-json",
			headers: { "content-type": "application/json" },
		});
		const r = await parseJsonBody(req, z.object({ foo: z.string() }));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.response.status).toBe(400);
	});

	it("rechaza validación Zod", async () => {
		const req = new NextRequest("http://localhost/api", {
			method: "POST",
			body: JSON.stringify({ foo: "" }),
			headers: { "content-type": "application/json" },
		});
		const r = await parseJsonBody(req, z.object({ foo: z.string().min(1) }));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.response.status).toBe(400);
	});
});
