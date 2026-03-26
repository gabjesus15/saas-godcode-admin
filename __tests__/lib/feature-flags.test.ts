import { describe, it, expect, beforeEach, vi } from "vitest";

describe("feature-flags", () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.FF_ONBOARDING_BILLING_EXTERNAL;
		delete process.env.ONBOARDING_BILLING_SERVICE_URL;
	});

	it("ONBOARDING_BILLING_EXTERNAL es false por defecto", async () => {
		const { flags } = await import("../../lib/feature-flags");
		expect(flags.ONBOARDING_BILLING_EXTERNAL).toBe(false);
	});

	it('ONBOARDING_BILLING_EXTERNAL es true cuando env es "true"', async () => {
		process.env.FF_ONBOARDING_BILLING_EXTERNAL = "true";
		const { flags } = await import("../../lib/feature-flags");
		expect(flags.ONBOARDING_BILLING_EXTERNAL).toBe(true);
	});

	it("ONBOARDING_BILLING_EXTERNAL es false con valor arbitrario", async () => {
		process.env.FF_ONBOARDING_BILLING_EXTERNAL = "yes";
		const { flags } = await import("../../lib/feature-flags");
		expect(flags.ONBOARDING_BILLING_EXTERNAL).toBe(false);
	});

	it("getOnboardingBillingBaseUrl retorna string vacio sin env", async () => {
		const { getOnboardingBillingBaseUrl } = await import("../../lib/feature-flags");
		expect(getOnboardingBillingBaseUrl()).toBe("");
	});

	it("getOnboardingBillingBaseUrl retorna URL limpia (sin trailing slash)", async () => {
		process.env.ONBOARDING_BILLING_SERVICE_URL = "http://localhost:3001/";
		const { getOnboardingBillingBaseUrl } = await import("../../lib/feature-flags");
		expect(getOnboardingBillingBaseUrl()).toBe("http://localhost:3001");
	});

	it("getOnboardingBillingBaseUrl hace trim de espacios", async () => {
		process.env.ONBOARDING_BILLING_SERVICE_URL = "  http://example.com  ";
		const { getOnboardingBillingBaseUrl } = await import("../../lib/feature-flags");
		expect(getOnboardingBillingBaseUrl()).toBe("http://example.com");
	});
});
