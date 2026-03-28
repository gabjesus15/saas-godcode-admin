/**
 * URL pública del sitio (BFF / dominio principal), no la URL del microservicio.
 * No usar VERCEL_URL aquí: en Vercel sería el host del API y los enlaces de correo quedarían mal.
 */
export function getAppUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");

	const base = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN?.trim();
	if (base) {
		const protocol = process.env.NEXT_PUBLIC_TENANT_PROTOCOL?.trim() || "https";
		const host = base.replace(/^https?:\/\//, "").replace(/\/$/, "");
		return `${protocol}://${host}`;
	}

	return "http://localhost:3001";
}
