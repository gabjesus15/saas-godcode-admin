"use client";

import { useEffect } from "react";

const SW_PATH = "/saas-admin/sw.js";
const SW_SCOPE = "/";

/**
 * Registra el service worker del panel super-admin (manifest vía metadata del layout).
 */
export function SaasAdminPwaRegister() {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		const register = async () => {
			try {
				await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
			} catch {
				// No bloquear la UI si el SW falla (HTTPS, permisos, etc.).
			}
		};

		void register();
	}, []);

	return null;
}
