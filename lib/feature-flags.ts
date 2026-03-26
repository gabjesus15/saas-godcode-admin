export type ProxyMode = "off" | "on" | "proxy_only";

function resolveProxyMode(): ProxyMode {
	const raw = (process.env.FF_ONBOARDING_BILLING_EXTERNAL ?? "").trim().toLowerCase();
	if (raw === "proxy_only") return "proxy_only";
	if (raw === "true") return "on";
	return "off";
}

export const flags = {
	ONBOARDING_BILLING_EXTERNAL: resolveProxyMode() !== "off",
	ONBOARDING_BILLING_MODE: resolveProxyMode(),
} as const;

export function getOnboardingBillingBaseUrl(): string {
	return process.env.ONBOARDING_BILLING_SERVICE_URL?.trim().replace(/\/$/, "") ?? "";
}
