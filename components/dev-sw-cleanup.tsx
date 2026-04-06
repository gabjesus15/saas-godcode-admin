"use client";

import { useEffect } from "react";

const ADMIN_SW_PATH = "/saas-admin/sw.js";

export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const run = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((reg) => reg.active?.scriptURL?.includes(ADMIN_SW_PATH))
            .map((reg) => reg.unregister()),
        );
      } catch {
        // Ignore cleanup errors in local development.
      }

      if (typeof caches === "undefined") return;

      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith("saas-admin-"))
            .map((key) => caches.delete(key)),
        );
      } catch {
        // Ignore cache cleanup errors in browsers with restricted Cache API access.
      }
    };

    void run();
  }, []);

  return null;
}
