export function getAppUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel}`;

	const base = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN?.trim();
	if (base) {
		const protocol = process.env.NEXT_PUBLIC_TENANT_PROTOCOL?.trim() || "https";
		const host = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
		return `${protocol}://${host}`;
	}

	return "http://localhost:3001";
}
