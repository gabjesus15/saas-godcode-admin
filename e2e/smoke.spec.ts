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
});
