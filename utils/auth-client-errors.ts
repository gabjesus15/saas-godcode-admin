/**
 * Convierte errores de @supabase (fetch / red / env) en mensajes claros para el usuario en login.
 */
export function mapAuthClientError(err: unknown): string {
	const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
	const msg =
		err && typeof err === "object" && "message" in err
			? String((err as { message: unknown }).message)
			: err instanceof Error
				? err.message
				: "";

	const lower = msg.toLowerCase();

	if (name === "AuthRetryableFetchError") {
		return "No pudimos conectar con el servicio de inicio de sesión. Revisa tu conexión, la configuración de Supabase en el servidor y que ningún bloqueador impida acceder a tu proyecto (*.supabase.co).";
	}

	if (
		lower.includes("failed to fetch") ||
		lower.includes("networkerror") ||
		lower.includes("network request failed") ||
		lower.includes("load failed")
	) {
		return "No pudimos conectar con el servicio de inicio de sesión. Revisa tu conexión a internet, que NEXT_PUBLIC_SUPABASE_URL sea correcta en el despliegue y desactiva extensiones que bloqueen peticiones a Supabase.";
	}

	if (lower.includes("missing supabase environment")) {
		return "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY). Contacta al administrador del sistema.";
	}

	if (msg.trim()) return msg;
	return "No se pudo iniciar sesión. Intenta de nuevo.";
}
