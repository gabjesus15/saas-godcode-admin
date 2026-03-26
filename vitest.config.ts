import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
		},
	},
	test: {
		environment: "node",
		include: ["__tests__/**/*.test.ts"],
		coverage: {
			include: ["lib/**/*.ts"],
			exclude: ["lib/onboarding/emails.ts"],
		},
	},
});
