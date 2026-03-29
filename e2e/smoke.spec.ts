import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
	test("página de login responde", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByText("Panel Super Admin")).toBeVisible({ timeout: 15_000 });
	});

	test("onboarding público responde", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(
			page.getByRole("heading", { name: /registra tu negocio|negocio/i }),
		).toBeVisible({ timeout: 15_000 });
	});

	test("ruta menú tenant responde (slug inexistente → tienda no disponible)", async ({ page }) => {
		await page.goto("/__e2e_no_such_tenant__/menu");
		await expect(page.getByRole("heading", { name: /tienda no disponible/i })).toBeVisible({
			timeout: 15_000,
		});
	});

	test("menú tenant con slug opcional (PLAYWRIGHT_TENANT_SLUG)", async ({ page }) => {
		const slug = process.env.PLAYWRIGHT_TENANT_SLUG?.trim();
		if (!slug) {
			test.skip();
			return;
		}
		await page.goto(`/${slug}/menu`);
		await expect(
			page.getByText("Tienda no disponible").or(page.getByText("Total:", { exact: false })),
		).toBeVisible({ timeout: 20_000 });
	});
});
