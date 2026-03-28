import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
	testDir: "e2e",
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: process.env.CI
		? {
				command: "npm run build && npm run start",
				url: baseURL,
				timeout: 180_000,
				reuseExistingServer: false,
			}
		: {
				command: "npm run start",
				url: baseURL,
				timeout: 60_000,
				reuseExistingServer: true,
			},
});
