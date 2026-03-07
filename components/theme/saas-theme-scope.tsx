"use client";

import { useEffect } from "react";

const STORAGE_KEY = "saas-theme";

export function SaasThemeScope() {
  useEffect(() => {
    const root = document.documentElement;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme =
        stored === "dark" || stored === "light"
          ? stored
          : prefersDark
            ? "dark"
            : "light";

      root.classList.toggle("dark", theme === "dark");
      root.setAttribute("data-theme", theme);
    } catch {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    return () => {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    };
  }, []);

  return null;
}
