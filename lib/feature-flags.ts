export const flags = {
	ONBOARDING_BILLING_EXTERNAL: process.env.FF_ONBOARDING_BILLING_EXTERNAL === "true",
} as const;

export function getOnboardingBillingBaseUrl(): string {
	return process.env.ONBOARDING_BILLING_SERVICE_URL?.trim().replace(/\/$/, "") ?? "";
}
